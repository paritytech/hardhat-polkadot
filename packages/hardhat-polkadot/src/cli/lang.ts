// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromEntries<T = any>(entries: Array<[string, any]>): T {
    return Object.assign(
        {},
        ...entries.map(([name, value]) => ({
            [name]: value,
        })),
    );
}

export function mapValues<T extends object, ResultT>(
    o: T,
    callback: (value: T[keyof T]) => ResultT[keyof ResultT],
): ResultT {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = {};

    for (const [key, value] of Object.entries(o)) {
        result[key] = callback(value);
    }

    return result;
}
