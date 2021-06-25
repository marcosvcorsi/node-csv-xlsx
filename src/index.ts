import axios from 'axios';
import { createWriteStream, WriteStream } from 'fs';
import { resolve } from 'path';
import * as XLSX from 'xlsx';

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

const appendResultsXlsx = (xlsxFileName: string, results: Array<any>) => {
  const workbook = XLSX.readFile(xlsxFileName);
}

(async () => {
  const fields = ['name', 'url'];

  const writer = createWriteStream(resolve(__dirname, '..', 'out', 'out.csv'));
  
  const workbook = XLSX.utils.book_new();
  const workSheetName = 'data';
  workbook.SheetNames.push(workSheetName);

  writeLine(fields, writer);
  
  const offset = 0;
  const limit = 100;
  
  const initialData = await getDataFromAPI(offset, limit);
  
  const { count, results } = initialData;
  
  writeResults(results, writer);
  
  const ws = XLSX.utils.json_to_sheet(results, {header: fields });
  workbook.Sheets[workSheetName] = ws;


  const xlsxFilename = resolve(__dirname, '..', 'out', 'out.xlsx');
  XLSX.writeFile(workbook, xlsxFilename);
  
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