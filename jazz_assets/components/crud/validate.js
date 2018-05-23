/**
    Helper functions for Assets-Catalog
    @module: validate.js
    @description: Defines validate functions.
    @author: Rashmi Chachan
    @version: 1.0
**/

const _ = require("lodash");


var validateIsEmptyInputData = function (assets_data, onComplete){
    if (_.isEmpty(assets_data)) {
        onComplete({
            "result": "inputError",
            "message": "Input asset data cannot be empty"
        });
    }else{        
        onComplete(null, {
            "result": "success",
            "input": assets_data
        });
    }
    
};

var validateEmptyFieldsVal = function (assets_data, onComplete){
    var invalid_fields = [];
    for (var field in assets_data) {
        var value = assets_data[field];
        if (!value) {
           invalid_fields.push(field);
        }
    }	
    if(invalid_fields.length > 0){
        var message = "Following fields does not provided a valid value - " + invalid_fields.join(", ");
        onComplete({
            "result": "inputError",
            "message": message
        });
    }else{
        onComplete(null, {
            "result": "success",
            "input": assets_data
        });
    }
    
};

var validateUnAllowedFieldsInInput = function (assets_data, fields_list, onComplete){
	 
	var invalid_fields = _.difference( _.keys(assets_data),_.values(fields_list));
    if(invalid_fields.length > 0){
        var message = "Following fields are invalid :  " + invalid_fields.join(", ") + ". ";
        onComplete({
            "result":"inputError",
            "message": message
        });
    }else{
        onComplete(null, {
            "result": "success",
            "input": assets_data
        });
    }
    
};

var validateAllRequiredFields = function (assets_data, required_fields, onComplete){   
	var missing_required_fields = _.difference(_.values(required_fields), _.keys(assets_data));
    if(missing_required_fields.length > 0){
        var message = "Following field(s) are required - " + missing_required_fields.join(", ");
        onComplete({
            "result": "inputError",
            "message": message
        });
    }else{
       onComplete(null, {
            "result": "success",
            "input": assets_data
        });
    }
    
};

var validateInputFieldTypes = function (assets_data, onComplete){    
	var invalid_fields = [];
	for (var field in assets_data) {
		if(assets_data[field]){
			if(!validateDataTypes(field, assets_data[field])){
				invalid_fields.push(field);
			}
		}
	}
	if(invalid_fields.length > 0){
        var message = "The following field's value/type is not valid - " + invalid_fields.join(", ") ;
        onComplete({
            "result":"inputError",
            "message": message
        });
    }else{
        onComplete(null, {
            "result": "success",
            "input": "Input value is valid"
        });
    }    
};
var validateDataTypes = function(field, prop_value){
	var fields_type = global.global_config.FIELD_DATA_TYPES;
	var field_status = false;	
	for (var type in fields_type) {
		if(field === type){
			if(fields_type[type] === 'String'){
				if(prop_value && (typeof prop_value == 'string' || prop_value instanceof String)){
					field_status = true;
				}
			}else if(fields_type[type] === 'Array'){
				if(prop_value && prop_value.constructor === Array){
					field_status = true;
				}
			}
		}
	}
	return field_status;
};

var validateEnumValues = function (assets_data,onComplete){
   	var invalid_fields = [];
	for (var field in assets_data) {
		if(assets_data[field]){
			var value = assets_data[field];
			switch (field) {
				case 'status':			
					if(!_.includes(global.global_config.ASSET_STATUS, value)){
						invalid_fields.push(field);
					}
					break;
				case 'type':
					if( !_.includes(global.global_config.ASSET_TYPES, value )){
						invalid_fields.push(field);
					}
					break;
			}
		}
		
	}
	
	if(invalid_fields.length > 0){
        var message = "The following field's value is not valid - " + invalid_fields.join(", ") ;
        onComplete({
            "result":"inputError",
            "message": message
        });
    }else{
        onComplete(null, {
            "result": "success",
            "input": "Input value is valid"
        });
    }   
};


module.exports = () => {
    return {
        validateIsEmptyInputData : validateIsEmptyInputData,
        validateEmptyFieldsVal:validateEmptyFieldsVal,
        validateUnAllowedFieldsInInput: validateUnAllowedFieldsInInput,
        validateAllRequiredFields : validateAllRequiredFields,
        validateInputFieldTypes : validateInputFieldTypes,
		validateEnumValues : validateEnumValues
    };
};
