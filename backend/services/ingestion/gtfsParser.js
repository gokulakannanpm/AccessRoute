import fs from 'fs';
import path from 'path';

/**
 * AccessRoute GTFS Static CSV Parser
 * Lightweight, zero-dependency parser for GTFS Static text files.
 * Handles quoted fields, escaped quotes, Windows (CRLF) and Unix (LF) line breaks,
 * and header trimming.
 */

export function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '\\' && inQuotes && i + 1 < line.length && (line[i + 1] === '"' || line[i + 1] === '\\')) {
      current += line[i + 1];
      i++;
    } else if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote in RFC 4180 style
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCsvString(content) {
  if (!content || typeof content !== 'string') {
    return { headers: [], rows: [] };
  }

  // Remove Byte Order Mark (BOM) if present
  const cleaned = content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
  const lines = cleaned.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = parseCsvLine(lines[0]);
  const headers = rawHeaders.map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 1 && values[0] === '') continue; // skip blank line

    const row = {};
    for (let h = 0; h < headers.length; h++) {
      row[headers[h]] = values[h] !== undefined ? values[h] : '';
    }
    rows.push(row);
  }

  return { headers, rows };
}

export function parseGtfsFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`GTFS file does not exist: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return parseCsvString(content);
}

export function parseGtfsDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`GTFS directory does not exist: ${dirPath}`);
  }

  const standardFiles = [
    'agency.txt',
    'routes.txt',
    'stops.txt',
    'trips.txt',
    'stop_times.txt',
    'calendar.txt',
    'calendar_dates.txt',
    'fare_attributes.txt',
    'fare_rules.txt',
    'shapes.txt',
    'pathways.txt',
    'feed_info.txt',
    'transfers.txt'
  ];

  const feed = {};
  const foundFiles = fs.readdirSync(dirPath);

  for (const file of standardFiles) {
    const fullPath = path.join(dirPath, file);
    if (fs.existsSync(fullPath)) {
      const key = file.replace('.txt', '');
      feed[key] = parseGtfsFile(fullPath);
    }
  }

  return {
    dirPath,
    foundFiles: foundFiles.filter(f => f.endsWith('.txt')),
    tables: feed
  };
}
