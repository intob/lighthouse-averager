const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const colors = require('colors');

const url = process.argv[2];
const limit = parseInt(process.argv[3]) || 3;

const scores = {
    performance: [],
    fcp: [],
    lcp: [],
    tti: [],
    tbt: [],
    cls: [],
    speed: []
};

console.log(`Will test ${url}  ${limit} times`);

(async () => {
    for(i = 0; i < limit; i++) {
        const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
        const options = {output: 'html', onlyCategories: ['performance'], port: chrome.port};
        const runnerResult = await lighthouse(url, options);
        
        console.log(`Report ${i+1} done, score was ${runnerResult.lhr.categories.performance.score * 100}`);

        scores.performance.push(runnerResult.lhr.categories.performance.score);
        scores.fcp.push(runnerResult.lhr.audits["first-contentful-paint"].score);
        scores.lcp.push(runnerResult.lhr.audits["largest-contentful-paint"].score);
        scores.tti.push(runnerResult.lhr.audits.interactive.score);
        scores.tbt.push(runnerResult.lhr.audits["total-blocking-time"].score);
        scores.cls.push(runnerResult.lhr.audits["cumulative-layout-shift"].score);
        scores.speed.push(runnerResult.lhr.audits["speed-index"].score);
        
        await chrome.kill();
    }

    console.log('Test complete'.green, '🎉');
    logMetric('Overall Performance', calcMean(scores.performance));
    logMetric('Largest Contentful Paint', calcMean(scores.lcp));
    logMetric('Total Blocking Time', calcMean(scores.tbt));
    logMetric('First Contentful Paint', calcMean(scores.fcp));
    logMetric('Time to Interactive', calcMean(scores.tti));
    logMetric('Speed Index', calcMean(scores.speed));
    logMetric('Cumulative Layout Shift', calcMean(scores.cls));
})();

function calcMean(metric) {
    let total = 0;
    metric.forEach(s => total+=s);
    return (total/metric.length).toFixed(2) * 100;
}

function logMetric(name, score) {
    if (score >= 90) {
        console.log(name, `${score}`.green, '🚀')
    } else if (score >= 50) {
        console.log(name, `${score}`.yellow)
    } else {
        console.log(name, `${score}`.red)
    }
    
}