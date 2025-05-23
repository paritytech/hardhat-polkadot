export function pluralize(n: number, singular: string, plural?: string) {
    if (n === 1) {
        return singular
    }

    if (plural !== undefined) {
        return plural
    }

    return `${singular}s`
}
