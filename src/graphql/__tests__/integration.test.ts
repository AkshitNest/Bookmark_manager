import { afterAll, describe, expect, test } from "bun:test";
import { prisma } from "../../db";
import { resolvers } from "../resolvers";

describe("PostgreSQL integration", () => {
  test("creates and reads a bookmark from the real PostgreSQL database", async () => {
    // Create a real folder in PostgreSQL
    const folder = await prisma.folder.create({
      data: {
        name: `Integration Test Folder ${Date.now()}`,
      },
    });

    // Call the real resolver
    const bookmark = await resolvers.Mutation.createBookmark(
      null,
      {
        title: "Integration Test Bookmark",
        url: "https://postgresql.org",
        folderId: folder.id,
        tags: [],
      },
    );

    // Verify the bookmark actually exists in PostgreSQL
    const savedBookmark = await prisma.bookmark.findUnique({
      where: {
        id: bookmark.id,
      },
    });

    expect(savedBookmark).not.toBeNull();
    expect(savedBookmark?.title).toBe("Integration Test Bookmark");
    expect(savedBookmark?.url).toBe("https://postgresql.org");
    expect(savedBookmark?.folderId).toBe(folder.id);

    // Cleanup
    await prisma.bookmark.delete({
      where: {
        id: bookmark.id,
      },
    });

    await prisma.folder.delete({
      where: {
        id: folder.id,
      },
    });
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});