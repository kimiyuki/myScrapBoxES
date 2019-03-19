function test(){
  1+3 
}

function getMyRss(skip) {
  //cache just for testing(multiple time fetching) purpose
  skip = skip ? skip : 0;
  var cache = CacheService.getScriptCache();
  var cache_name = 'rss'+skip;
  var cached = cache.get(cache_name);
  if(cached != null){
    Logger.log("cached: " + cache_name);
    return cached;
  }
  var res = UrlFetchApp.fetch("https://scrapbox.io/api/pages/kimiyuki?skip="+skip).getContentText();
  cache.put(cache_name, res, 60*60);
  return res;
}

function getData(){
  var ret = [];
  var data = getMyRss(0);
  data = JSON.parse(data);
  count = data.count;
  ret = data.pages;
  //Logger.log(data.count);
  //Logger.log(ret.map(function(e){return e.title}));
  var care = 0;// just for faile-safe for permanent loop
  for(var skip=0; count > (skip*100)+100; skip++){
    num = (skip*100)+100;
    //Logger.log(num);
    data = JSON.parse(getMyRss(num));
    ret = ret.concat(data.pages);
    care = care + 1;
    if(care > 20) break;
  }
  return ret.map(function(e){
    return  {title:e.title, views:e.views, id: e.id, descriptions: e.descriptions, created:e.created, updated:e.updated, accessed:e.accessed, linked:e.linked}
  });
}  

function queryBQ(){
  var date = new Date();
  date.setDate(date.getDate() - 1);
  var YDAY = Utilities.formatDate(date, "JST", "yyyyMMdd");
  date.setDate(date.getDate() - 1);
  var Y2DAY = Utilities.formatDate(date, "JST", "yyyyMMdd");
  var sql1 = "#standardSQL\nwith a as(select title, views, 'yday' as date from scrapbox.dailylog_" + YDAY;
  var sql2 = " union all select title, views, 'y2day' as date from scrapbox.dailylog_" + Y2DAY + ")";
  var sql3 = " select title, case when count(*) = 1 then max(views) else max(views)-min(views) end as views from a group by title order by views desc";
  var sql = sql1+sql2+sql3;
  Logger.log(sql);
  return _queryBQ("abc-analytics", sql);
}

function loadBQ(data){
  var  date = new Date();
  date.setDate(date.getDate() - 1);
  var DATE = Utilities.formatDate(date, "JST", "yyyy-MM-dd");
  data = data.map(function(e){ e['date'] = DATE; e['descriptions'] = e['descriptions'].map(function(x){return {"text": x}}); return e});
  //Logger.log(data);
  var projectId, datasetId, tableId, data;
  projectId= 'abc-analytics';
  datasetId = 'scrapbox';
  tableId = 'dailylog_'+ DATE.replace(/-/g, '');
  var schema = {
      fields: [
        {name: 'id', type: 'STRING'},
        {name: 'date', type: 'DATE'},
        {name: 'title', type: 'STRING'},
        {name: 'views', type : 'INTEGER'},
        {name: 'accessed', type : 'INTEGER'},
        {name: 'created', type : 'INTEGER'},
        {name: 'updated', type : 'INTEGER'}, 
        {name: 'linked', type: "INTEGER"},
        {name: 'descriptions', type : 'RECORD', mode:"REPEATED", fields: [{"name": "text", type:"STRING"}]}
      ]
    };
  _loadBQ(projectId, datasetId, tableId, "OBJECT", data, schema);
}

function main(){
  var data = getData();
  loadBQ(data);
  data = data.map(function(e){return [e.title, e.views]});
  data = data.sort(function(a,b){
    return a[1] < b[1] ? 1
         : a[1] > b[1] ? -1
         : 0;
  });
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("data");
  ret = queryBQ();
  sh.clearContents();
  sh.getRange(1,1,ret.length,ret[0].length).setValues(ret);
}

