import { prisma } from "../db";

interface FolderArgs {
  id: string;
}

interface FolderParent {
  id: string;
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
  },

  Folder: {
    bookmarks: async (parent: FolderParent) => {
      return prisma.bookmark.findMany({
        where: {
          folderId: parent.id,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    },
  },
};