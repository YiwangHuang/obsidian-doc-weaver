// import deasync from 'deasync';

/**
 * 将异步操作转换为同步操作 // TODO: 暂时弃用,考虑删除
 * @param promise 要等待的 Promise
 * @param timeout 最大等待时间(ms)，默认 5000ms
 * @returns Promise 的结果
 * @throws 超时错误或 Promise 拒绝的错误
 */
export function syncWait<T>(promise: Promise<T>, timeout = 5000): T {
    let result: T;
    let error: any;
    let done = false;
    
    // 开始时间
    const startTime = Date.now();
    
    // 处理 Promise
    promise
        .then(value => {
            result = value;
            done = true;
        })
        .catch(err => {
            error = err;
            done = true;
        });
    
    // 等待循环
    while (!done) {
        // 检查是否超时
        if (Date.now() - startTime > timeout) {
            throw new Error(`Operation timed out after ${timeout}ms`);
        }

        // 强制运行事件循环和微任务队列
        const xhr = new XMLHttpRequest();
        xhr.open('HEAD', 'data:,', false);  // false means synchronous
        try {
            xhr.send();
        } catch (e) {
            // 忽略错误，我们只是利用同步XHR来阻塞主线程
        }

        // 给其他任务一些执行时间
        const waitEnd = Date.now() + 10;
        while (Date.now() < waitEnd) {
            // 主动等待一小段时间
        }
    }
    
    // 如果有错误则抛出
    if (error) {
        throw error;
    }
    
    return result!;
}

// export function syncWait2<T>(promise: Promise<T>): T {
//     new Promise(resolve => setTimeout(resolve, 1000));
//     return promise;
// }

// function syncPromise<T>(promise: Promise<T>): T {
//     let done = false;
//     let result: T;
//     let error: any;

//     promise
//         .then(value => {
//             result = value;
//             done = true;
//         })
//         .catch(err => {
//             error = err;
//             done = true;
//         });

//     deasync.loopWhile(() => !done);

//     if (error) throw error;
//     return result!;
// }