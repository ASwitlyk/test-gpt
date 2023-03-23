// Description: Types for the Douay-Rheims Bible

export enum OpenAIModel {
    DAVINCI_TURBO = "gpt-3.5-turbo"
};

export type BibleBook = {
    book: string;
    chapters: BibleBookChapter[];
};

export type BibleBookChapter = {
    book: string;
    chapterUrl: string;
    chapter: number;
    verses: BibleBookVerse[];
};

// export type BibleBookChunk = {
//     book: string;
//     chapter: number;
//     verse: number;
//     chapter_url: string;
//     content: string;
//     content_length: number;
//     content_tokens: number;
//     embedding: number[];
// }

export type BibleBookVerse = {
    book: string;
    chapter: number;
    verse: number;
    text: string;
    text_length: number;
    text_tokens: number;
    embedding: number[];
};

export type BibleJSON = {
    current_date: string;
    url: string;
    length: number;
    tokens: number;
    books: BibleBook[];
};

