/**
 * Converts a Uint8Array to a hexadecimal string representation
 */
export function toHex(data: Uint8Array): string {
  return Array.from(data)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Prints Uint8Array contents in a readable hex format with optional label
 */
export function logBytes(data: Uint8Array, label: string = "Bytes"): void {
  const hex = toHex(data);
  const formatted = hex.match(/.{1,8}/g)?.join(' ') || hex;
  console.log(`${label} (${data.length} bytes): ${formatted}`);
}

// Optional: Add chunk grouping for larger arrays
export function logBytesChunked(data: Uint8Array, label: string = "Bytes", bytesPerLine: number = 16): void {
  const hex = toHex(data);
  
  console.log(`${label} (${data.length} bytes):`);
  
  for (let i = 0; i < data.length; i += bytesPerLine) {
    const chunk = data.slice(i, i + bytesPerLine);
    const hexChunk = toHex(chunk);
    const offset = i.toString(16).padStart(8, '0');
    const formatted = hexChunk.match(/.{1,2}/g)?.join(' ') || '';
    
    // Create ASCII representation
    const ascii = Array.from(chunk).map(b => 
      b >= 32 && b < 127 ? String.fromCharCode(b) : '.'
    ).join('');
    
    console.log(`${offset}: ${formatted.padEnd(bytesPerLine * 3, ' ')} | ${ascii}`);
  }
} 