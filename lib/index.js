import _ from 'lodash';
import express from 'express';
import bodyParser from 'body-parser';
import blessed from 'blessed';

const screen = blessed.screen({
  smartCSR: true
});

screen.title = 'toby - dead simple http load test aggregator';

const storage = {};

function render() {
  const heading = blessed.box({
    fg: 'magenta',
    bg: 'black',
    align: 'left',
    width: '75%',
    height: '10%'
  });

  heading.setContent('toby - totally hackable load test runner');
  screen.append(heading);

  const itemStyle = {
    fg: 'green',
    bg: 'black',
    border: {
      fg: 'white'
    },
    align: 'left'
  };

  const table = blessed.ListTable({
    align: 'left',
    top: 'center',
    width: '75%',
    height: '90%',
    border: {
      type: 'line'
    },
    style: {
      item: itemStyle,
      selected: itemStyle,
      header: itemStyle
    }
  });

  const header = [['resource', 'avg duration (ms)', 'max duration (ms)', 'min duration (ms)', 'length']];

  const rows = _.map(storage, (stat, key) => {
    return [
      _.toString(key),
      _.toString(stat.totalDuration / stat.hits),
      _.toString(stat.max),
      _.toString(stat.min),
      _.toString(stat.totalLength / stat.hits)
    ];
  });

  table.setData(header.concat(rows));

  screen.append(table);
  screen.render();
}

function update(samples) {
  _.each(samples, sample => {
    const key = `${sample.url} - ${sample.method} - ${sample.status}`;

    const s = storage[key] = storage[key] || {
      hits: 0,
      totalDuration: 0,
      totalLength: 0,
      max: 0,
      min: Number.MAX_SAFE_INTEGER
    };

    s.hits = s.hits + 1;
    s.totalDuration = s.totalDuration + sample.duration;
    s.totalLength = s.totalLength + sample.responseLength;
    s.max = Math.max(sample.duration, s.max);
    s.min = Math.min(sample.duration, s.min);
  });
}

const app = express();

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

app.post('/stats', (req, res) => {
  setImmediate(() => update(req.body));
  res.sendStatus(200);
});

app.listen(3999, () => {

});

function loop(){
  render();
  setTimeout(loop, 1000);
}

loop();
