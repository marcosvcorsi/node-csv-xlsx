import axios from 'axios';
import { createWriteStream, WriteStream } from 'fs';
import { resolve } from 'path';
import Excel from 'exceljs';

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
  return results.map((item: any) => writeLine(Object.values(item), ws));
}

const writeXlsxResults = (results: Array<any>, ws: Excel.Worksheet) => {
  console.log(results);

  results.map(result => ws.addRow(Object.values(result)));
}

(async () => {
  const fields = ['name', 'url'];

  const csvWriter = createWriteStream(resolve(__dirname, '..', 'out', 'out.csv'));
  const xlsxWriter = createWriteStream(resolve(__dirname, '..', 'out', 'out.xlsx'));

  var workbook = new Excel.stream.xlsx.WorkbookWriter({ stream: xlsxWriter })
  var worksheet = workbook.addWorksheet('data')
  
  worksheet.addRow(fields);
  
  writeLine(fields, csvWriter);
  
  const offset = 0;
  const limit = 100;
  
  const initialData = await getDataFromAPI(offset, limit);
  
  const { count, results } = initialData;
  
  writeResults(results, csvWriter);
  writeXlsxResults(results, worksheet);
    
  let offsetCount = limit;

  while(offsetCount < count) {
    const data = await getDataFromAPI(offsetCount, limit);
    
    writeResults(data.results, csvWriter);
    writeXlsxResults(data.results, worksheet);

    offsetCount += limit;

    console.log('processed:', offsetCount);

    await delay(250);
  }

  worksheet.commit(); 
  workbook.commit();

  csvWriter.end();
})();