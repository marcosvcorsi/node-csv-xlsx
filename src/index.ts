import axios from 'axios';
import { createWriteStream, fstat, WriteStream } from 'fs';
import { resolve } from 'path';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getDataFromAPI = async (offset: number, limit: number) => {
  const { data } = await axios.get('https://pokeapi.co/api/v2/pokemon', {
    params: {
      offset,
      limit
    }
  });

  return data;
}

const writeLine = (values: Array<any>, ws: WriteStream) => {
  ws.write(`${values.join(',')}\n`);
}

const writeResults = (results: Array<any>, ws: WriteStream) => {
  results.map((item: any) => writeLine(Object.values(item), ws));
}

(async () => {
  const fields = ['name', 'url'];

  const writer = createWriteStream(resolve(__dirname, '..', 'out', 'out.csv'));

  writeLine(fields, writer);

  const offset = 0;
  const limit = 100;

  const initialData = await getDataFromAPI(offset, limit);

  const { count, results } = initialData;

  writeResults(results, writer);

  let offsetCount = limit;

  while(offsetCount < count) {
    const data = await getDataFromAPI(offsetCount, limit);
    
    writeResults(data.results, writer);

    offsetCount += limit;

    console.log('processed:', offsetCount);

    await delay(250);
  }

  writer.end();
})();