import { BibleBook, BibleBookChunk, BibleJSON } from "@/types/douayRheims";
import axios, { AxiosError } from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import { encode } from "gpt-3-encoder";

const BASE_URL = "https://catechismclass.com/my_bible.php/";
const CHUNK_SIZE = 200;


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
  } else {
    console.error(error);
  }
}

/**
 * Axios get request wrapper
 */
const axiosGetWrapper = async (url: string) => {
  try {
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
 * create an asynchroneous function that returns an array of BibleBooks and their links
 * from the catechismclass.com website
 */
const getBookLinks = async () => {
  const AxiosResponse = await axiosGetWrapper(BASE_URL);
  if (!AxiosResponse) return;
  const $ = cheerioLoadWrapper(AxiosResponse.data);
  let $ul = $('ul.chapter');
  let children = $ul.children();
  let books = [];
  children.map((i, child) => {
    let book = [];
    child.children.map((i, child) => {
      // console.log(i);
      i.children.map((i, child) => {
        book.push(i.data)
      });
      book.push(i.attribs.href);
      books.push(book);
    });
  });
  console.log(books);

  // let lists = $ul.children;

  // console.log($ul);
  // console.log(lists);





  // const $ = cheerio.load(AxiosResponse.data);
  // const tables = $("table");

  // const linksArr: { url: string; title: string }[] = [];

  // tables.each((i, table) => {
  //   if (i === 2) {
  //     const links = $(table).find("a");
  //     links.each((i, link) => {
  //       const url = $(link).attr("href");
  //       const title = $(link).text();

  //       if (url && url.endsWith(".html")) {
  //         const linkObj = {
  //           url,
  //           title
  //         };

  //         linksArr.push(linkObj);
  //       }
  //     });
  //   }
  // });

  // return linksArr;
}

/***
 * create an asynchroneous function that returns the number of chapters in a book from the
 * catechismclass.com website
 */
const getChapterCount = async (book: string) => {

}

/**
 * create an asynchroneous function that returns the chapter page from the catechismclass.com website
 */
const getChapterPage = async (book: string, chapter: number) => {

}

/**
 * create an asynchroneous function that scrapes the verses in each chapter of a book from the
 * catechismclass.com website
 */
const getChapterVerses = async (book: string, chapter: number) => {
  
}

(async () => {
  const links = await getBookLinks();
  console.log(links);
} )();