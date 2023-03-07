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
 * create an asynchroneous function that returns an array of BibleBooks and their links
 *  from the catechismclass.com website
 */
const getBookLinks = async () => {
  try {
    const AxiosResponse = await axios.get(`${BASE_URL}`);
  } catch (error) {
    if (error instanceof AxiosError) {
      axiosErrorHandler(error);
    } else {
      console.error(error);
    }
  }

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