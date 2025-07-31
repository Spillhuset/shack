import type { RESTCurrentResponse, RESTNextResponse } from "./types";

export function fetchNextEvents(): Promise<RESTNextResponse> {
  return fetch("https://spillhuset.com/next")
    .then(response => response.json())
    .then(data => data as RESTNextResponse);
}

export function fetchCurrentEvent(date?: Date): Promise<RESTCurrentResponse> {
  return fetch(`https://spillhuset.com/current${date ? `/${Math.ceil(date.getTime() / 1000)}` : ""}`)
    .then(response => response.json())
    .then(data => data as RESTCurrentResponse);
}
