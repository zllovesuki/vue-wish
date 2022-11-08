export interface Link {
  rel: string;
  url: string;
  [key: string]: string;
}
export interface Links {
  [key: string]: Link;
}
export declare function parserLinkHeader(links: string): Links;
export {};
