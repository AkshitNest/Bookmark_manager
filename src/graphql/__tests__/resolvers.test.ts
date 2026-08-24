import { GraphQLError } from "graphql";
import { resolvers } from "../resolvers";
import { describe, expect, test, mock } from "bun:test";
describe("createFolder", () => {
  test("creates a folder successfully", async () => {
    const createdFolder = {
      id: "folder-1",
      name: "Development",
      createdAt: new Date(),
    };

    const prisma = await import("../../db");
    const originalCreate = prisma.prisma.folder.create;

    prisma.prisma.folder.create = mock(
      async () => createdFolder,
    ) as any;

    const result = await resolvers.Mutation.createFolder(
      {},
      {
        name: "Development",
      },
    );

    expect(result).toEqual(createdFolder);
    expect(prisma.prisma.folder.create).toHaveBeenCalled();

    prisma.prisma.folder.create = originalCreate;
  });

  test("rejects an empty folder name", async () => {
    try {
      await resolvers.Mutation.createFolder(
        {},
        {
          name: "   ",
        },
      );

      throw new Error("Expected createFolder to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);

      const graphqlError = error as GraphQLError;

      expect(graphqlError.message).toBe(
        "Folder name cannot be empty",
      );

      expect(graphqlError.extensions.code).toBe(
        "VALIDATION_ERROR",
      );
    }
  });
});


describe("updateBookmark", () => {
  test("updates a bookmark successfully", async () => {
    const existingBookmark = {
      id: "bookmark-1",
      title: "Old Title",
      url: "https://example.com",
      folderId: "folder-1",
      tags: [],
      createdAt: new Date(),
    };

    const updatedBookmark = {
      ...existingBookmark,
      title: "New Title",
    };

    const prisma = await import("../../db");

    const originalFindUnique =
      prisma.prisma.bookmark.findUnique;

    const originalUpdate =
      prisma.prisma.bookmark.update;

    prisma.prisma.bookmark.findUnique = mock(
      async () => existingBookmark,
    ) as any;

    prisma.prisma.bookmark.update = mock(
      async () => updatedBookmark,
    ) as any;

    const result = await resolvers.Mutation.updateBookmark(
      {},
      {
        id: "bookmark-1",
        title: "New Title",
      },
    );

    expect(result).toEqual(updatedBookmark);
    expect(prisma.prisma.bookmark.update).toHaveBeenCalled();

    prisma.prisma.bookmark.findUnique = originalFindUnique;
    prisma.prisma.bookmark.update = originalUpdate;
  });

  test("rejects a non-existent bookmark", async () => {
    const prisma = await import("../../db");

    const originalFindUnique =
      prisma.prisma.bookmark.findUnique;

    prisma.prisma.bookmark.findUnique = mock(
      async () => null,
    ) as any;

    try {
      await resolvers.Mutation.updateBookmark(
        {},
        {
          id: "missing-bookmark",
          title: "New Title",
        },
      );

      throw new Error("Expected updateBookmark to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);

      const graphqlError = error as GraphQLError;

      expect(graphqlError.message).toBe(
        "Bookmark not found",
      );

      expect(graphqlError.extensions.code).toBe(
        "NOT_FOUND",
      );
    }

    prisma.prisma.bookmark.findUnique = originalFindUnique;
  });
});


describe("deleteBookmark", () => {
  test("deletes a bookmark successfully", async () => {
    const existingBookmark = {
      id: "bookmark-1",
      title: "Test",
      url: "https://example.com",
      folderId: "folder-1",
      tags: [],
      createdAt: new Date(),
    };

    const prisma = await import("../../db");

    const originalFindUnique =
      prisma.prisma.bookmark.findUnique;

    const originalDelete =
      prisma.prisma.bookmark.delete;

    prisma.prisma.bookmark.findUnique = mock(
      async () => existingBookmark,
    ) as any;

    prisma.prisma.bookmark.delete = mock(
      async () => existingBookmark,
    ) as any;

    const result = await resolvers.Mutation.deleteBookmark(
      {},
      {
        id: "bookmark-1",
      },
    );

    expect(result).toBe(true);
    expect(prisma.prisma.bookmark.delete).toHaveBeenCalled();

    prisma.prisma.bookmark.findUnique = originalFindUnique;
    prisma.prisma.bookmark.delete = originalDelete;
  });

  test("rejects a non-existent bookmark", async () => {
    const prisma = await import("../../db");

    const originalFindUnique =
      prisma.prisma.bookmark.findUnique;

    prisma.prisma.bookmark.findUnique = mock(
      async () => null,
    ) as any;

    try {
      await resolvers.Mutation.deleteBookmark(
        {},
        {
          id: "missing-bookmark",
        },
      );

      throw new Error("Expected deleteBookmark to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);

      const graphqlError = error as GraphQLError;

      expect(graphqlError.message).toBe(
        "Bookmark not found",
      );

      expect(graphqlError.extensions.code).toBe(
        "NOT_FOUND",
      );
    }

    prisma.prisma.bookmark.findUnique = originalFindUnique;
  });
});


describe("moveBookmark", () => {
  test("moves a bookmark successfully", async () => {
    const bookmark = {
      id: "bookmark-1",
      title: "Test",
      url: "https://example.com",
      folderId: "folder-1",
      tags: [],
      createdAt: new Date(),
    };

    const folder = {
      id: "folder-2",
      name: "New Folder",
      createdAt: new Date(),
    };

    const movedBookmark = {
      ...bookmark,
      folderId: "folder-2",
    };

    const prisma = await import("../../db");

    const originalBookmarkFindUnique =
      prisma.prisma.bookmark.findUnique;

    const originalFolderFindUnique =
      prisma.prisma.folder.findUnique;

    const originalUpdate =
      prisma.prisma.bookmark.update;

    prisma.prisma.bookmark.findUnique = mock(
      async () => bookmark,
    ) as any;

    prisma.prisma.folder.findUnique = mock(
      async () => folder,
    ) as any;

    prisma.prisma.bookmark.update = mock(
      async () => movedBookmark,
    ) as any;

    const result = await resolvers.Mutation.moveBookmark(
      {},
      {
        id: "bookmark-1",
        folderId: "folder-2",
      },
    );

    expect(result).toEqual(movedBookmark);
    expect(result.folderId).toBe("folder-2");
    expect(prisma.prisma.bookmark.update).toHaveBeenCalled();

    prisma.prisma.bookmark.findUnique =
      originalBookmarkFindUnique;

    prisma.prisma.folder.findUnique =
      originalFolderFindUnique;

    prisma.prisma.bookmark.update =
      originalUpdate;
  });

  test("rejects moving to a non-existent folder", async () => {
    const bookmark = {
      id: "bookmark-1",
      title: "Test",
      url: "https://example.com",
      folderId: "folder-1",
      tags: [],
      createdAt: new Date(),
    };

    const prisma = await import("../../db");

    const originalBookmarkFindUnique =
      prisma.prisma.bookmark.findUnique;

    const originalFolderFindUnique =
      prisma.prisma.folder.findUnique;

    prisma.prisma.bookmark.findUnique = mock(
      async () => bookmark,
    ) as any;

    prisma.prisma.folder.findUnique = mock(
      async () => null,
    ) as any;

    try {
      await resolvers.Mutation.moveBookmark(
        {},
        {
          id: "bookmark-1",
          folderId: "missing-folder",
        },
      );

      throw new Error("Expected moveBookmark to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);

      const graphqlError = error as GraphQLError;

      expect(graphqlError.message).toBe(
        "Folder not found",
      );

      expect(graphqlError.extensions.code).toBe(
        "NOT_FOUND",
      );
    }

    prisma.prisma.bookmark.findUnique =
      originalBookmarkFindUnique;

    prisma.prisma.folder.findUnique =
      originalFolderFindUnique;
  });
});