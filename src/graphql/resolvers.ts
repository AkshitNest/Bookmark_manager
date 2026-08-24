import { GraphQLError } from "graphql";
import { prisma } from "../db";

interface FolderArgs {
  id: string;
}

interface FolderParent {
  id: string;
}

interface BookmarksArgs {
  folderId?: string;
  search?: string;
  take?: number;
  cursor?: string;
}

const validationError = (message: string) =>
  new GraphQLError(message, {
    extensions: {
      code: "VALIDATION_ERROR",
    },
  });

const notFoundError = (message: string) =>
  new GraphQLError(message, {
    extensions: {
      code: "NOT_FOUND",
    },
  });

export const resolvers = {
  Query: {
    folders: async () => {
      return prisma.folder.findMany({
        orderBy: {
          createdAt: "asc",
        },
      });
    },

    folder: async (_parent: unknown, args: FolderArgs) => {
      return prisma.folder.findUnique({
        where: {
          id: args.id,
        },
      });
    },

    bookmarks: async (_parent: unknown, args: BookmarksArgs) => {
      const take = Math.min(Math.max(args.take ?? 10, 1), 50);

      const bookmarks = await prisma.bookmark.findMany({
        where: {
          ...(args.folderId
            ? {
                folderId: args.folderId,
              }
            : {}),

          ...(args.search
            ? {
                OR: [
                  {
                    title: {
                      contains: args.search,
                      mode: "insensitive",
                    },
                  },
                  {
                    url: {
                      contains: args.search,
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {}),
        },

        orderBy: [
          {
            createdAt: "asc",
          },
          {
            id: "asc",
          },
        ],

        take: take + 1,

        ...(args.cursor
          ? {
              cursor: {
                id: args.cursor,
              },
              skip: 1,
            }
          : {}),
      });

      const hasNextPage = bookmarks.length > take;

      const items = hasNextPage ? bookmarks.slice(0, take) : bookmarks;

      const nextCursor = hasNextPage
        ? (items[items.length - 1]?.id ?? null)
        : null;

      return {
        items,
        nextCursor,
      };
    },
  },

  Folder: {
    bookmarks: async (parent: FolderParent) => {
      return prisma.bookmark.findMany({
        where: {
          folderId: parent.id,
        },
        orderBy: [
          {
            createdAt: "asc",
          },
          {
            id: "asc",
          },
        ],
      });
    },
  },

  Mutation: {
    createFolder: async (_parent: unknown, args: { name: string }) => {
      const name = args.name.trim();

      if (!name) {
        throw validationError("Folder name cannot be empty");
      }

      return prisma.folder.create({
        data: {
          name,
        },
      });
    },

    createBookmark: async (
      _parent: unknown,
      args: {
        title: string;
        url: string;
        folderId: string;
        tags?: string[];
      },
    ) => {
      const title = args.title.trim();

      // Validate title
      if (!title) {
        throw validationError("Bookmark title cannot be empty");
      }

      // Validate URL
      try {
        new URL(args.url);
      } catch {
        throw validationError("Bookmark URL must be a valid URL");
      }

      // Validate folder
      const folder = await prisma.folder.findUnique({
        where: {
          id: args.folderId,
        },
      });

      if (!folder) {
        throw notFoundError("Folder not found");
      }

      return prisma.bookmark.create({
        data: {
          title,
          url: args.url,
          tags: args.tags ?? [],
          folderId: args.folderId,
        },
      });
    },

    updateBookmark: async (
      _parent: unknown,
      args: {
        id: string;
        title?: string | null;
        url?: string | null;
        tags?: string[] | null;
      },
    ) => {
      // Check bookmark exists
      const existingBookmark = await prisma.bookmark.findUnique({
        where: {
          id: args.id,
        },
      });

      if (!existingBookmark) {
        throw notFoundError("Bookmark not found");
      }

      const data: {
        title?: string;
        url?: string;
        tags?: string[];
      } = {};

      // Validate updated title
      if (args.title !== undefined && args.title !== null) {
        const title = args.title.trim();

        if (!title) {
          throw validationError("Bookmark title cannot be empty");
        }

        data.title = title;
      }

      // Validate updated URL
      if (args.url !== undefined && args.url !== null) {
        try {
          new URL(args.url);
        } catch {
          throw validationError("Bookmark URL must be a valid URL");
        }

        data.url = args.url;
      }

      if (args.tags !== undefined && args.tags !== null) {
        data.tags = args.tags;
      }

      return prisma.bookmark.update({
        where: {
          id: args.id,
        },
        data,
      });
    },

    deleteBookmark: async (_parent: unknown, args: { id: string }) => {
      // Check bookmark exists
      const existingBookmark = await prisma.bookmark.findUnique({
        where: {
          id: args.id,
        },
      });

      if (!existingBookmark) {
        throw notFoundError("Bookmark not found");
      }

      await prisma.bookmark.delete({
        where: {
          id: args.id,
        },
      });

      return true;
    },

    moveBookmark: async (
      _parent: unknown,
      args: {
        id: string;
        folderId: string;
      },
    ) => {
      // Check bookmark exists
      const bookmark = await prisma.bookmark.findUnique({
        where: {
          id: args.id,
        },
      });

      if (!bookmark) {
        throw notFoundError("Bookmark not found");
      }

      // Check destination folder exists
      const folder = await prisma.folder.findUnique({
        where: {
          id: args.folderId,
        },
      });

      if (!folder) {
        throw notFoundError("Folder not found");
      }

      return prisma.bookmark.update({
        where: {
          id: args.id,
        },
        data: {
          folderId: args.folderId,
        },
      });
    },
  },
};