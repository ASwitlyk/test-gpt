import { BibleBook, BibleBookChapter, BibleBookVerse, BibleJSON } from "@/types/douayRheims";
import axios, { AxiosError } from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import { encode } from "gpt-3-encoder";
// import winston from "winston/lib/winston/config";
import winston from "winston";
import pThrottle from "p-throttle";

const BASE_URL = "https://catechismclass.com/";
const HOME_PAGE_SUFFIX = "my_bible.php";
const BOOKS_PAGE_SUFFIX = "bible/";
const CHUNK_SIZE = 1000;

const throttle = pThrottle({
  limit: 2,
  interval: 1000
});


const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ],
});




/**
 * Axios Error handler
 */
const axiosErrorHandler = (error: AxiosError) => {
  console.error(error);
}

/**
 * Axios Error handler wrapper - so we can use it in a try/catch block
 */
const axiosErrorHandlerWrapper = (error) => {
  if (error instanceof AxiosError) {
    axiosErrorHandler(error);
    logger.error(error);
  } else {
    logger.error(error);
    // console.error(error);
  }
}

/**
 * Axios get request wrapper with delay option
 */
const axiosGetWrapper = async (url: string, delay?: number) => {
  try {
    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    const AxiosResponse = await axios.get(url);
    return AxiosResponse;
  } catch (error) {
    axiosErrorHandlerWrapper(error);
  }
}

/**
 * Cheerio load wrapper
 * @param html
 * @returns
 */
const cheerioLoadWrapper = (html: string) => {
  const $ = cheerio.load(html);
  return $;
}

/**
 * create an asynchroneous function that returns an array of Parent Books and their links
 * from the catechismclass.com website
 * it makes one async call so no need to throttle
 */
const getParentBookLinks = async () => {
  const AxiosResponse = await axiosGetWrapper(BASE_URL + HOME_PAGE_SUFFIX, 100);
  if (!AxiosResponse) return;
  const $ = cheerioLoadWrapper(AxiosResponse.data);
  let $ul = $('a.chapterTitle');

  const links: { url: string; title: string }[] = [];

  $ul.map((i, child) => {
    const linkObj = { url: child.attribs.href, title: child?.firstChild?.data };
    links.push(linkObj);
  });

  return links;
}

interface ChapterLinks {
  chapterTitle: string;
  chapters: { url: string; title: string }[];
}

/**
 * create an asynchroneous function that returns the books and the links to thier chapters
 */
// const getBookLinks = async (parentBooks: { url: string; title: string }[]) => {

//   const bookLinks: ChapterLinks[] = [];

//   await Promise.all(parentBooks.map(async (parentBook) => {
//     // get the html from the parent book
//     const AxiosResponse = await axios.get(BASE_URL + parentBook.url);

//     if (!AxiosResponse) return;
//     const $ = cheerioLoadWrapper(AxiosResponse.data);
//     const $li = $('li > strong');
//     const $liChildren = $li.children();
//     // iterate over the children - here in catechismclass.com/bible/<book> the children w/ this selector
//     // are the <li class="chapterTitle"> elements
//     $liChildren.prevObject?.each((i, child) => {
//       const chLinks = {} as ChapterLinks;
//       // get the chapter title
//       // First child is the <strong> element w/ the book names
//       chLinks.chapterTitle = child.children[0].data;
//       // initialize the chapters array
//       chLinks.chapters = [];
//       bookLinks.push(chLinks);
//       // get the chapters and their links - find the <ul> element w/ class chapter
//       // then iterate over the <li> elements to get the links and and chapter titles

//       // chapters is all the <li> elements in the <ul> element w/ class chapter
//       const chapters = child.next.next.next.next.children;

//       chapters.forEach((chapter) => {

//         const chapterLink = {
//           url: chapter.children[0].attribs.href,
//           title: chapter.children[0].children[0].data,
//         };
//         chLinks.chapters.push(chapterLink);
//       });
//     });
//   }));

//   return bookLinks;
// }

/**
 * Get book links helper function which extracts the async function inside the 
 * getBookLinks parentBook.map method
 */
const extractChapterLinks = throttle(async (parentBook: { url: string; title: string }, bookLinks: ChapterLinks[]) => {
  const AxiosResponse = await axiosGetWrapper(BASE_URL + parentBook.url);
  if (!AxiosResponse) return;
  const $ = cheerioLoadWrapper(AxiosResponse.data);
  const $li = $('li > strong');
  const $liChildren = $li.children();
  // iterate over the children - here in catechismclass.com/bible/<book> the children w/ this selector
  // are the <li class="chapterTitle"> elements
  $liChildren.prevObject?.each((i, child) => {
    const chLinks = {} as ChapterLinks;
    // get the chapter title
    // First child is the <strong> element w/ the book names
    chLinks.chapterTitle = child.children[0].data;
    // initialize the chapters array
    chLinks.chapters = [];
    bookLinks.push(chLinks);
    // get the chapters and their links - find the <ul> element w/ class chapter
    // then iterate over the <li> elements to get the links and and chapter titles

    // chapters is all the <li> elements in the <ul> element w/ class chapter
    const chapters = child.next.next.next.next.children;

    chapters.forEach((chapter) => {

      const chapterLink = {
        url: chapter.children[0].attribs.href,
        title: chapter.children[0].children[0].data,
      };
      chLinks.chapters.push(chapterLink);
    });
  });
});

/**
 * An asynchroneous function that returns the books and the links to thier chapters
 * @param parentBooks 
 * @returns 
 */
const getBookLinksGPT = async (parentBooks: { url: string; title: string }[]) => {

  const bookLinks: ChapterLinks[] = [];

  await Promise.all(parentBooks.map(async (parentBook) => {
    // get the html from the parent book
    await extractChapterLinks(parentBook, bookLinks);
  }));
  return bookLinks;
};




/**
 * create an asynchroneous function that returns the chapter and verse from each book and the text
 * of that verse
 */
// const getBookChapterVerse = async (bookLinks: ChapterLinks[]) => {

//   // initialize the bible object and populate
//   const bible = {} as BibleJSON;
//   bible.books = [];

  
//   const books: BibleBook[] = [];

//   await Promise.all(bookLinks.map(async (bookLink) => {
//     // start scrape of each book and initialize the book object
//     const book = {} as BibleBook;
//     book.title = bookLink.chapterTitle;
//     book.chapters = [];
//     await Promise.all(bookLink.chapters.map(async (chapter) => {
//       // go to each chapter in the subject book
//       let url = BASE_URL + BOOKS_PAGE_SUFFIX + chapter.url;

//       const AxiosResponse = await axios.get(BASE_URL + BOOKS_PAGE_SUFFIX + chapter.url);


//       if (!AxiosResponse) return;
//       const bookChapter = {} as BibleBookChapter;
//       bookChapter.book = book.title;
//       bookChapter.chapterUrl = url;
//       bookChapter.chapter = Number.parseInt(url.match(/[0-9]{2}/g)[0]);
//       bookChapter.verses = [];
//       const $ = cheerioLoadWrapper(AxiosResponse.data);
//       const $p = $('p');
//       $p.each((i, child) => {
//         // scrape chapter, verse and text
//         if (child.children.length === 2) {
//           const bookVerse = {} as BibleBookVerse;
//           // console.log(child.children[0].children[0].data);
//           let verseChapter = child.children[0].children[0].data;
//           let splitBookVerse = verseChapter.split(" ");
//           let chapterVerse = splitBookVerse[1];
//           let chapter = chapterVerse.split(":")[0];
//           let verse = chapterVerse.split(":")[1];
//           bookVerse.verse = Number.parseInt(verse);
//           bookVerse.chapter = Number.parseInt(chapter);
//           bookVerse.text= child.children[1].data;
//           bookVerse.book = book.title;
//           bookChapter.verses.push(bookVerse);
//         }
//       });
//       book.chapters.push(bookChapter);
//     }));
//     bible.books.push(book);
//   }));
//   return bible;
// };



/**
 * create an asynchroneous function that returns the chapter and verse from each book and the text
 * of that verse
 */
const getBookChapterVerseGPT = async (bookLinks: ChapterLinks[]) => {

  // initialize the bible object and populate
  const bible = {} as BibleJSON;
  bible.books = [];

  
  const books: BibleBook[] = [];

  await Promise.all(bookLinks.map(async (bookLink) => {
    // start scrape of each book and initialize the book object
    const book = {} as BibleBook;
    book.title = bookLink.chapterTitle;
    book.chapters = [];
    await Promise.all(bookLink.chapters.map(async (chapter) => {
      await scrapeChapter(book, chapter);
    }));
    bible.books.push(book);
  }));
  return bible;
};


/**
 * scrape chapter helper
 */
const scrapeChapter = throttle(async (book: BibleBook, chapter: any) => {
  // go to each chapter in the subject book
  let url = BASE_URL + BOOKS_PAGE_SUFFIX + chapter.url;

  const AxiosResponse = await axiosGetWrapper(BASE_URL + BOOKS_PAGE_SUFFIX + chapter.url);

  if (!AxiosResponse) return;

  const bookChapter = {} as BibleBookChapter;
  bookChapter.book = book.title;
  bookChapter.chapterUrl = url;
  bookChapter.chapter = Number.parseInt(url.match(/[0-9]{2}/g)[0]);
  bookChapter.verses = [];
  const $ = cheerioLoadWrapper(AxiosResponse.data);
  const $p = $('p');
  $p.each((i, child) => {
    // scrape chapter, verse and text
    if (child.children.length === 2) {
      const bookVerse = {} as BibleBookVerse;
      let verseChapter = child.children[0].children[0].data;
      let splitBookVerse = verseChapter.split(" ");
      let chapterVerse = splitBookVerse[1];
      let chapter = chapterVerse.split(":")[0];
      let verse = chapterVerse.split(":")[1];
      bookVerse.verse = Number.parseInt(verse);
      bookVerse.chapter = Number.parseInt(chapter);

      let trimmedText = child.children[1].data.trim();

      bookVerse.text= trimmedText;
      bookVerse.text_length = trimmedText.length;
      bookVerse.text_tokens = encode(trimmedText).length;
      bookVerse.book = book.title;
      bookChapter.verses.push(bookVerse);
    }
  });
  book.chapters.push(bookChapter);
});

const mockedBlink = [
  {
    chapterTitle: "Genesis",
    chapters: [
      {
        url: "torah/genesis_01.php",
        title: "Genesis 1",
      },
      {
        url: "torah/genesis_02.php",
        title: "Genesis 2",
      }]
  }];

(async () => {
  const links = await getParentBookLinks();
  // console.log(links);
  // let bLinks = await getBookLinks(links);

  let bLinks = await getBookLinksGPT(links);
  // console.log(bLinks);
  // console.log(JSON.stringify(bLinks));
  // const bible = await getBookChapterVerseGPT(mockedBlink);
  // console.log(bible);

  // UNCOMMENT THIS LINE TO GET THE BIBLE
  // const bible = await getBookChapterVerse(bLinks);
  const bible = await getBookChapterVerseGPT(bLinks);

  // console.log(bible);
  // console.log(JSON.stringify(bible));

  // write the bible object to a json file
  fs.writeFile('scripts/bible3.json', JSON.stringify(bible), (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });
})();