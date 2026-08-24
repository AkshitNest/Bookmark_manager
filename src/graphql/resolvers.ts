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
        throw new Error("Folder name cannot be empty");
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

      if (!title) {
        throw new Error("Bookmark title cannot be empty");
      }

      try {
        new URL(args.url);
      } catch {
        throw new Error("Bookmark URL must be a valid URL");
      }

      const folder = await prisma.folder.findUnique({
        where: {
          id: args.folderId,
        },
      });

      if (!folder) {
        throw new Error("Folder not found");
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
      const existingBookmark = await prisma.bookmark.findUnique({
        where: {
          id: args.id,
        },
      });

      if (!existingBookmark) {
        throw new Error("Bookmark not found");
      }

      const data: {
        title?: string;
        url?: string;
        tags?: string[];
      } = {};

      if (args.title !== undefined && args.title !== null) {
        const title = args.title.trim();

        if (!title) {
          throw new Error("Bookmark title cannot be empty");
        }

        data.title = title;
      }

      if (args.url !== undefined && args.url !== null) {
        try {
          new URL(args.url);
        } catch {
          throw new Error("Bookmark URL must be a valid URL");
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
      const existingBookmark = await prisma.bookmark.findUnique({
        where: {
          id: args.id,
        },
      });

      if (!existingBookmark) {
        throw new Error("Bookmark not found");
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
      const bookmark = await prisma.bookmark.findUnique({
        where: {
          id: args.id,
        },
      });

      if (!bookmark) {
        throw new Error("Bookmark not found");
      }

      const folder = await prisma.folder.findUnique({
        where: {
          id: args.folderId,
        },
      });

      if (!folder) {
        throw new Error("Folder not found");
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
