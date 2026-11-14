// The Book of the Month (data/book-of-the-month.json): a book we recommend that is NOT in the library;
// readers are sent to Al-Islam.org to read it.
import data from "@data/book-of-the-month.json";
import { getAuthorByName } from "./catalog";

export type BookOfTheMonth = Omit<typeof data, "_comment"> & { authorSlug?: string };

export const bookOfTheMonth: BookOfTheMonth = {
  ...data,
  authorSlug: getAuthorByName(data.authorInCatalogue)?.slug,
};
