const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const colors = require('colors');
const cliProgress = require('cli-progress');

const url = process.argv[2];
const limit = parseInt(process.argv[3]) || 3;
const config = process.argv[4] || require('./config.json');

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
    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.rect)
    progressBar.start(limit, 0);
    
    const tStart = Date.now();

    for(i = 0; i < limit; i++) {
        const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});

        const runnerResult = await lighthouse(url, {port: chrome.port}, config);

        scores.performance.push(runnerResult.lhr.categories.performance.score);
        scores.fcp.push(runnerResult.lhr.audits["first-contentful-paint"].score);
        scores.lcp.push(runnerResult.lhr.audits["largest-contentful-paint"].score);
        scores.tti.push(runnerResult.lhr.audits.interactive.score);
        scores.tbt.push(runnerResult.lhr.audits["total-blocking-time"].score);
        scores.cls.push(runnerResult.lhr.audits["cumulative-layout-shift"].score);
        scores.speed.push(runnerResult.lhr.audits["speed-index"].score);

        progressBar.update(i+1);
        progressBar.updateETA();

        await chrome.kill();
    }

    const tEnd = Date.now();

    progressBar.stop();

    console.log(`🎉 done in ${(tEnd-tStart)/1000}s`);
    logMetric('Overall Performance', calcMean(scores.performance) * 100);
    logMetric('Largest Contentful Paint', calcMean(scores.lcp) * 100);
    logMetric('Total Blocking Time', calcMean(scores.tbt) * 100);
    logMetric('First Contentful Paint', calcMean(scores.fcp) * 100);
    logMetric('Time to Interactive', calcMean(scores.tti) * 100);
    logMetric('Speed Index', calcMean(scores.speed) * 100);
    logMetric('Cumulative Layout Shift', 100 - (calcMean(scores.cls, 6) * 100));
})();

function calcMean(metric, fractionDigits=2) {
    let total = 0;
    metric.forEach(s => total+=s);
    return (total/metric.length).toFixed(fractionDigits);
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