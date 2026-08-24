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
                title: {
                  contains: args.search,
                  mode: "insensitive",
                },
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

      const items = hasNextPage
        ? bookmarks.slice(0, take)
        : bookmarks;

      const nextCursor = hasNextPage
        ? items[items.length - 1]?.id ?? null
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
};