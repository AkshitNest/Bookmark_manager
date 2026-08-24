import { describe, expect, test, mock } from "bun:test";
import { GraphQLError } from "graphql";
import { resolvers } from "../resolvers";

describe("createBookmark", () => {
  test("creates a bookmark successfully", async () => {
    const createdBookmark = {
      id: "bookmark-1",
      title: "Postgres",
      url: "https://postgresql.org",
      folderId: "folder-1",
      tags: [],
      createdAt: new Date(),
    };

    const originalCreate = resolvers.Mutation.createBookmark;

    // Mock Prisma calls used by the resolver
    const prisma = await import("../../db");

    const originalFindUnique = prisma.prisma.folder.findUnique;
    const originalBookmarkCreate = prisma.prisma.bookmark.create;

    prisma.prisma.folder.findUnique = mock(
      async () => ({ id: "folder-1", name: "Postgres" }) as any,
    ) as any;

    prisma.prisma.bookmark.create = mock(
      async () => createdBookmark,
    ) as any;

    const result = await originalCreate(
      {},
      {
        title: "Postgres",
        url: "https://postgresql.org",
        folderId: "folder-1",
      },
    );

    expect(result).toEqual(createdBookmark);
    expect(prisma.prisma.bookmark.create).toHaveBeenCalled();

    prisma.prisma.folder.findUnique = originalFindUnique;
    prisma.prisma.bookmark.create = originalBookmarkCreate;
  });

  test("rejects an empty bookmark title", async () => {
    const createBookmark = resolvers.Mutation.createBookmark;

    try {
      await createBookmark(
        {},
        {
          title: "   ",
          url: "https://example.com",
          folderId: "folder-1",
        },
      );

      throw new Error("Expected createBookmark to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);

      const graphqlError = error as GraphQLError;

      expect(graphqlError.message).toBe(
        "Bookmark title cannot be empty",
      );

      expect(graphqlError.extensions.code).toBe(
        "VALIDATION_ERROR",
      );
    }
  });

  test("rejects an invalid bookmark URL", async () => {
    const createBookmark = resolvers.Mutation.createBookmark;

    try {
      await createBookmark(
        {},
        {
          title: "Test Bookmark",
          url: "not-a-valid-url",
          folderId: "folder-1",
        },
      );

      throw new Error("Expected createBookmark to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);

      const graphqlError = error as GraphQLError;

      expect(graphqlError.message).toBe(
        "Bookmark URL must be a valid URL",
      );

      expect(graphqlError.extensions.code).toBe(
        "VALIDATION_ERROR",
      );
    }
  });
});