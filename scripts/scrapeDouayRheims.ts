import { BibleBook, BibleBookChunk, BibleJSON } from "@/types/douayRheims";
import axios, { AxiosError } from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import { encode } from "gpt-3-encoder";

const BASE_URL = "https://catechismclass.com/my_bible.php/";
const HOME_PAGE_SUFFIX = "my_bible.php";
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
 * create an asynchroneous function that returns an array of Parent Books and their links
 * from the catechismclass.com website
 */
const getParentBookLinks = async () => {
  const AxiosResponse = await axiosGetWrapper(BASE_URL + HOME_PAGE_SUFFIX);
  if (!AxiosResponse) return;
  const $ = cheerioLoadWrapper(AxiosResponse.data);
  let $ul = $('a.chapterTitle');

  const linksArr: { url: string; title: string }[] = [];

  $ul.map((i, child) => {
    const linkObj = { url: child.attribs.href, title: child.firstChild.data };
    linksArr.push(linkObj);
  });

  return linksArr;
}

/**
 * create an asynchroneous function that returns the books and the links to thier chapters
 */
const getBookLinks = async (parentBooks: { url: string; title: string }[]) => {
  parentBooks.map(async (parentBook) => {
    const AxiosResponse = await axiosGetWrapper(BASE_URL + parentBook.url);
    if (!AxiosResponse) return;
    const $ = cheerioLoadWrapper(AxiosResponse.data);
    let $ul = $('a.chapterTitle');
  });
   
  const AxiosResponse = await axiosGetWrapper(BASE_URL + parentBooks[0].url);
  if (!AxiosResponse) return;
  const $ = cheerioLoadWrapper(AxiosResponse.data);
  let $ul = $('a.chapterTitle');

  const linksArr: { url: string; title: string }[] = [];

  $ul.map((i, child) => {
    const linkObj = { url: child.attribs.href, title: child.firstChild.data };
    linksArr.push(linkObj);
  });

  return linksArr;
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
  const links = await getParentBookLinks();
  console.log(links);
} )();