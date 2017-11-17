'use strict';

angular.module('mms')
  .factory('TableService', ['$q', '$http', 'URLService', 'UtilsService', 'CacheService', '_', 'ElementService', TableService]);

function TableService($q, $http, URLService, UtilsService, CacheService, _, ElementService) {

  function readvalues(splot, projectId, refId, commitId){ 

    var deferred = $q.defer();
    var plot = JSON.parse(splot);

    var aMmsEid = {projectId: projectId, refId: refId, commitId: commitId};
    var isHeader = (plot.table.header !== undefined && plot.table.header.length > 0 ? true : false);

    if (plot.config.length !== 0){
      plot.config = JSON.parse(plot.config.replace(/'/g, '"'));
    }
    if (isHeader) {
      var aheader = asyncReadTableHeader(aMmsEid, plot.table.header[0]);
      aheader.then( function(tableheader){
        var abody = asyncReadTableBody(aMmsEid, plot.table.body);
        abody.then( function(tablebody){
          var r = {tableheader: tableheader, tablebody: tablebody, isHeader: isHeader};
          deferred.resolve(r);
        });
      });
    }
    else {
      var abody = asyncReadTableBody(aMmsEid, plot.table.body);
      abody.then( function(tablebody){
        var r = {tablebody: tablebody, isHeader:isHeader};
        deferred.resolve(r);
      });
    }
    return deferred.promise;
  } //end of readValues
  
  function asyncReadTableHeader(aMmsEid, header){ 
    return $q( function(resolve){
      readRowValues(header, aMmsEid)
        .then(function(tableheader) {
        tableheader.values.shift(); //remove 1st element
        resolve(tableheader.values);
      });
    });
  } 

  function asyncReadTableBody(aMmsEid, tablebody) {
    return $q( function (resolve){
      var c3_data = [];
      var valuesO = [];
      
      tablebody.forEach(function(row){
        readRowValues(row, aMmsEid)
          .then(function (yyvalue){
            c3_data.push(yyvalue.values);
            valuesO.push(yyvalue.valuesO);
            if ( c3_data.length === tablebody.length) {
              var r = {
                c3_data: c3_data,
                valuesO: valuesO 
              };
              resolve(r);
            }
          });
      });
    });
  }

  function getValue(datavalue){
    if (datavalue && datavalue.type === "LiteralString"){
      if ( isNaN(datavalue.value))
        return datavalue.value;
      else
        return Number(datavalue.value);
    }
    else if (datavalue && (datavalue.type === "LiteralReal" || datavalue.type === "LiteralInteger")){
      return datavalue.value;
    }
  } 
  function readParagraphValue(e,aMmsEid, index){

    return $q( function(resolve){
        if (e.content[0].sourceType == 'text'){
          //console.log("text");
          var tv = e.content[0].text.replace("<p>","").replace("</p>","").replace(" ", "");
          if ( !isNaN(tv))
            tv = Number(tv);
          resolve( { index: index, value: tv, valueO: e});
        }
        else if (e.content[0].sourceType === 'reference'){
          aMmsEid.elementId =e.content[0].source;

          if ( e.content[0].sourceProperty === 'name'){
            //console.log("name");
            ElementService.getElement(aMmsEid, 1, false)
              .then(function(refe) {
                //value = refe.name;
                //valueO= refe;
                var nameModified = refe.name;
                if ( !isNaN(nameModified)) //means it is a number
                    nameModified = Number(nameModified);
                resolve( { index: index, value: nameModified, valueO: refe});
              });
          }
          else if ( e.content[0].sourceProperty === 'documentation'){
              //console.log("doc");
              ElementService.getElement(aMmsEid, 1, false)
                .then(function(refe) {
                  var docModified = refe.documentation.replace("<p>","").replace("</p>","").replace(" ", "");    
                  //seems adding \n at the end when modified at vieweditor so if number goahead to conver to number
                  //i.e., "5\n" will be a number.
                  if ( !isNaN(docModified)) //means it is a number
                    docModified = Number(docModified);
                  resolve( { index: index, value: docModified, valueO: refe});
                }); 
          }
          else { //sourceProperty === 'value'
              //console.log('value');
              ElementService.getElement(aMmsEid, 1, false)
              .then(function(refe) {

                var valueO= refe;
                var value = "";
                if (refe.type === 'Property' || refe.type === 'Port') {
                    if (refe.defaultValue) {
                        value = getValue(refe.defaultValue); //default value
                    } else {
                        value= "";
                    }
                }
                if (refe.type === 'Slot') {
                    value = getValue(refe.value[0]); //scope.element.value
                }
                /* not sure what to do
                if (refe.type === 'Constraint' && refe.specification) {
                    value = refe.specification;
                }
                if (refe.type === 'Expression') {
                    value = refe.operand;
                }
                */
                resolve( { index: index, value: value, valueO: valueO});
              });
            }//end of else
          } //reference
    });
  }
  function readRowValues ( row, aMmsEid ){

    return $q( function (resolve) {
      var values = [];
      var valuesO = [];
      var index = 0;
      row.forEach(function(e){
      //  console.log(e);
       if (e.content[0].type == 'Paragraph'){
          readParagraphValue(e, aMmsEid, index++)
          .then( function(r){
            values[r.index] =r.value;
            valuesO[r.index] = r.valueO;
            if ( values.length === row.length){
              var result = {
                  values: values,
                  valuesO: valuesO 
              };
              resolve(result);
            }
          });
        } //Paragraph
      }); //for each row
    });
  } //end of function

 //make only a-zA-Z0-9_ because id or class does not support special characters(ie., ())
    var toValidId = function(original) {
        return original.replace(/[^a-zA-Z0-9_]/gi, '');
    };


    return {
        toValidId : toValidId,
        readvalues: readvalues
    };

}
