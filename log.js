export default function log(id, ...msg) {
    if(process.env.SCRAPE_DEBUG) {
        console.log(`[${id}]`, ...msg)
    }
}