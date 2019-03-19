//https://developers.google.com/adwords/scripts/docs/solutions/bigquery-exporter?hl=ja
function _loadBQ(projectId, datasetId, tableId, datatype, data, schema) {
  //expectation: data is 2d array with headers.
  if(datatype == "CSV") data = data.map(function(e){return e.join(",")}).join("\n")
  //expectation javascript object
  if(datatype == "OBJECT") data = data.map(function(e){ return JSON.stringify(e)}).join("\n");
  //Logger.log(data);
  data = Utilities.newBlob(data, 'application/octet-stream');
  var table = {
    tableReference: {
      projectId: projectId,
      datasetId: datasetId,
      tableId: tableId
    },
    schema: schema
  };
  var job = {
      configuration: {
        load: {
          destinationTable: {projectId: projectId, datasetId: datasetId, tableId: tableId},
          writeDisposition: 'WRITE_TRUNCATE',
          //skipLeadingRows: 1,
          sourceFormat: "NEWLINE_DELIMITED_JSON"
        }}};
  try{
    table = BigQuery.Tables.get(projectId, datasetId, tableId);
     //Create the data upload job.
  }catch(er){
    table = BigQuery.Tables.insert(table, projectId, datasetId);
  }
  job = BigQuery.Jobs.insert(job, projectId, data);
  Logger.log(job); 
}

//I do not use it in this project
function _queryBQ(projectId, query){
  var request = {query: query};
  //Logger.log(request.query);
  var queryResults = BigQuery.Jobs.query(request, projectId);
  var jobId = queryResults.jobReference.jobId;
  // Check on status of the Query Job.
  var sleepTimeMs = 500;
  while (!queryResults.jobComplete) {
    Utilities.sleep(sleepTimeMs);
    sleepTimeMs *= 2;
    queryResults = BigQuery.Jobs.getQueryResults(projectId, jobId);
  } 
  //Logger.log(queryResults.rows);
  var rows = queryResults.rows;
  while (queryResults.pageToken) {
    queryResults = BigQuery.Jobs.getQueryResults(projectId, jobId, {
      pageToken: queryResults.pageToken
    });
    rows = rows.concat(queryResults.rows);
  }
  var headers = queryResults.schema.fields.map(function(field) {return field.name;});

  if (rows) {
    // Append the results.
    var data = new Array(rows.length);
    for (var i = 0; i < rows.length; i++) {
      var cols = rows[i].f;
      data[i] = new Array(cols.length);
      for (var j = 0; j < cols.length; j++) {
        data[i][j] = cols[j].v;
      }
    }
    return [headers].concat(data);
  } else {
    return [headers];
    //throw "something Wrong"
  }
}
