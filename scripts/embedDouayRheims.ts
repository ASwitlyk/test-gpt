import { BibleJSON, BibleBookVerse, BibleBook } from "@/types/douayRheims";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { Configuration, OpenAIApi } from "openai";
import pThrottle from "p-throttle";

loadEnvConfig("");

const throttle = pThrottle({
  limit: 1,
  interval: 200
});

const generateEmbeddings = async (books: BibleBook[]) => {
  const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
  const openai = new OpenAIApi(configuration);

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  books.forEach(async (book) => {
    book.chapters.forEach(async (chapter) => {
      chapter.verses.forEach(async (verse: BibleBookVerse) => {
        const { book, chapter, verse: verseNumber, text, length, tokens, chapterUrl } = verse;

        const embeddingResponse = await openai.createEmbedding({
          model: "text-embedding-ada-002",
          input: text
        });

        const [{ embedding }] = embeddingResponse.data.data;

        const { data, error } = await supabase
          .from("bible")
          .insert({
            book,
            chapter,
            verse: verseNumber,
            text,
            length,
            tokens,
            chapterUrl,
            embedding
          })
          .select("*");

        if (error) {
          console.log("error", error);
        } else {
          console.log("saved", book, chapter, verseNumber);
        }
      });
    });
  });
};

(async () => {
  const bible: BibleJSON = JSON.parse(fs.readFileSync("scripts/bible.json", "utf8"));

  const verses: BibleVerse[] = bible.books.flatMap((book) => {
    return book.chapters.flatMap((chapter) => {
      return chapter.verses.map((verse) => {
        return {
          ...verse,
          chapterUrl: chapter.chapterUrl
        };
      });
    });
  });

  await generateEmbeddings(verses);
})();



