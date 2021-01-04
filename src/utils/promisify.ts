export function promisifyEventEmit(event, args = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    event.emit({
      ...args,
      callback: (error, data) => {
        if (error) {
          reject(error);
        }
        resolve(data);
      }
    });
  })
}
