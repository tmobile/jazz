	var maskXMLData = function(strXML, maskConfigData) {
	    if (strXML == null) {
	        strXML = '';
			return strXML;
	    }
	    for (var data in maskConfigData) {
	        var elementToMask = maskConfigData[data].tagToMask;
	        var maskChar = maskConfigData[data].maskChar;
	        var keepLastChars = Number(maskConfigData[data].keepLastChars);
	        var maskingStr = '';
			var attributeToMask = '';
	        if (elementToMask.indexOf('/@') > -1) {
	            attributeToMask = elementToMask.split('@')[1];
	            elementToMask = elementToMask.split('/')[0];
	        }
	        var splitStr = strXML.split(elementToMask)[0].split('<').pop().trim();
			var namespace = '';
	        if (splitStr.slice(-1) === ':') {
	            namespace = splitStr.substr(0, splitStr.indexOf(':'));
	        } 

	        if (namespace && attributeToMask) {
	            strRegExPattern = '<' + namespace + ':' + elementToMask + '(.*?)' + attributeToMask + '=\"(.*?)"(.*?)>(.*?)</' + namespace + ':' + elementToMask + '>';
	        } else if (namespace) {
	            strRegExPattern = '<' + namespace + ':' + elementToMask + '(.*?)>(.*?)</' + namespace + ':' + elementToMask + '>';
	        } else if (attributeToMask) {
	            strRegExPattern = '<' + elementToMask + '(.*?)' + attributeToMask + '=\"(.*?)"(.*?)>(.*?)</' + elementToMask + '>';
	        } else {
	            strRegExPattern = '<' + elementToMask + '(.*?)>(.*?)</' + elementToMask + '>';
	        }

	        var matches = strXML.match(new RegExp(strRegExPattern, 'g'));
	        if (matches) {
				//Masking Attributes
	            if (attributeToMask) { 
                  if (namespace) {
	                    var attrRegExPatternXML = '<' + namespace + ':' + elementToMask + '(.*?)' + attributeToMask + '="' + '(.*?)' + '"';
	                } else {
	                    var attrRegExPatternXML = '<' + elementToMask + '(.*?)' + attributeToMask + '="' + '(.*?)' + '"';
	                }
	                attributeToMask = '';
	                var tagMatch = strXML.match(new RegExp(attrRegExPatternXML, 'g'));
	                if (tagMatch) {
	                    for (var i = 0; i < tagMatch.length; i++) {
	                        var arrElem = tagMatch[i].split("=");
	                        var attributeToMaskValue = arrElem[1];
	                        var count = 1;
	                        if (attributeToMaskValue.length > keepLastChars) {
	                            count = attributeToMaskValue.length - keepLastChars - 1;
	                            for (var a = 0; a < count - 1; a++) {
	                                if (!maskingStr) {
	                                    maskingStr = maskChar;
	                                } else {
	                                    maskingStr = maskingStr + maskChar;
	                                }
	                            }
	                            var maskedAttribute = tagMatch[i].replace(attributeToMaskValue.substring(1, count), maskingStr);
	                            maskingStr = '';
							    //replacing the masked attribute value within the original xmlString.
	                            strXML = strXML.replace(tagMatch[i], maskedAttribute);
	                        }
	                    }
	                }
	            } else {
					//Masking Elements
	                for (var i = 0; i < matches.length; i++) {
	                    var elementToMaskValue = matches[i].substring(matches[i].indexOf(">") + 1, matches[i].indexOf("</"));
	                    var count = 1;
	                    if (elementToMaskValue.length > keepLastChars) {
	                        count = elementToMaskValue.length - keepLastChars;
	                        for (var a = 0; a < count; a++) {
	                            if (!maskingStr) {
	                                maskingStr = maskChar;
	                            } else {
	                                maskingStr = maskingStr + maskChar;
	                            }
	                        }
	                        var maskedElement = matches[i].replace(elementToMaskValue.substring(0, count), maskingStr);
	                        maskingStr = '';
	                        //replacing the masked element value within the original xmlString.
	                        strXML = strXML.replace(matches[i], maskedElement);
	                    }
	                }
	            } // End else
	        } // End if(matches)
	    } // End for (var data in maskConfigData)
	    return strXML;
	}

	var maskJSONData = function(strJSON, maskConfigData) {
		strJSON= strJSON.split(' ').join('');
	    for (var data in maskConfigData) {
	        var tagToMask = maskConfigData[data].tagToMask;
	        var maskChar = maskConfigData[data].maskChar;
	        var keepLastChars = Number(maskConfigData[data].keepLastChars);
	        var maskingStr = '';
	        //Checking for the path of the attributes
	        if (tagToMask.indexOf('/') > -1) {
	            if (tagToMask.indexOf('@') > -1) {
	                var pathOfElement = tagToMask.split("/");
	                var paretnElement = pathOfElement[0];
	                var TagToBeMasked = pathOfElement[pathOfElement.length - 1];
	                var strRegExPatternJSON = '"' + paretnElement + '":' + '(.*?)' + '{' + '"' + TagToBeMasked + '":' + '(.*?)' + '(,|})';
	                var tagMatch = strJSON.match(new RegExp(strRegExPatternJSON, 'g'));
	                if (tagMatch) {
	                    for (var i = 0; i < tagMatch.length; i++) {
	                        var lastChar = '}';
	                        //Checking weather it is simple element with attribute or complex element with attribute
	                        if (tagMatch[i].indexOf(',') > -1) {
	                            lastChar = ',';
	                        }
	                        var attrRegExPattern = '"' + TagToBeMasked + '":' + '(.*?)' + lastChar;
	                        var matchesAttr = tagMatch[i].match(new RegExp(attrRegExPattern, 'g'));
	                        if (matchesAttr) {
	                            for (var j = 0; j < matchesAttr.length; j++) {
	                                var prefix = matchesAttr[j].substring(0, matchesAttr[j].indexOf("\":"));
	                                var elementToBeMasked = matchesAttr[j].split("\":").pop().split(lastChar).shift();
	                                var maskedElement = '';
	                                if (elementToBeMasked.length > keepLastChars) {
	                                    var count = elementToBeMasked.length - keepLastChars;
	                                    if (elementToBeMasked.indexOf("\"") == -1) {
	                                        //element to be masked is an integer
	                                        for (var a = 0; a < count; a++) {
	                                            if (!maskingStr) {
	                                                maskingStr = '*';
	                                            } else {
	                                                maskingStr = maskingStr + '*';
	                                            }
	                                        }
	                                        maskedElement = "\"" + elementToBeMasked.replace(elementToBeMasked.substring(0, count), maskingStr) + "\"";
	                                        maskingStr = '';
	                                    } else {
	                                        //element to be masked is a string
	                                        for (var a = 0; a < count - 2; a++) {
	                                            if (!maskingStr) {
	                                                maskingStr = '*';
	                                            } else {
	                                                maskingStr = maskingStr + '*';
	                                            }
	                                        }
	                                        maskedElement = "\"" + elementToBeMasked.replace(elementToBeMasked.substring(0, count - 1), maskingStr);
	                                        maskingStr = '';
	                                    }
	                                } else {
	                                    //elementToBeMasked.length <= keepLastChars
	                                    maskedElement = elementToBeMasked;
	                                }
	                                //Replace the masked String in the parent json
	                                strJSON = strJSON.replace(matchesAttr[j], prefix + "\":" + maskedElement + lastChar);
	                            }
	                        }
	                    }
	                }
	            }
	        } else {

	            //Expression to get all the data to be masked
	            var strRegExPatternJSON = '"' + tagToMask + '":' + '(.*?)' + '(,|})';
	            var tagMatch = strJSON.match(new RegExp(strRegExPatternJSON, 'g'));
	            //List created to ensure, repeated elements are not processed
	            var listOfElements = new Array();
	            if (tagMatch) {
	                for (var i = 0; i < tagMatch.length; i++) {
	                    if (tagMatch[i].indexOf('{') > -1) {
	                        //Element to be masked contains an attribute 
	                        if (tagMatch[i].indexOf('[') > -1) {
	                            //Element to be masked contains an attribute and is an array								
	                            var arrRegExPatternJSON = '"' + tagToMask + '":\\[{' + '(.*?)' + '#text' + '(.*?)' + '\\]';
	                            var attrArrMatch = strJSON.match(new RegExp(arrRegExPatternJSON, 'g'));
	                            if (attrArrMatch) {
	                                for (var j = 0; j < attrArrMatch.length; j++) {
	                                    if (listOfElements.indexOf(attrArrMatch[j]) == -1) {
	                                        //Get the individual array elements
	                                        var attrArrayRegExPattern = '{' + '(.*?)' + '}';
	                                        var matchesAttrArr = attrArrMatch[j].match(new RegExp(attrArrayRegExPattern, 'g'));
	                                        if (matchesAttrArr) {
	                                            //Mask Individual Object in array
	                                            for (var k = 0; k < matchesAttrArr.length; k++) {
	                                                var prefix = matchesAttrArr[k].substring(0, matchesAttrArr[k].indexOf("#text\":"));
	                                                var elementToBeMasked = matchesAttrArr[k].split("#text\":").pop().split("}").shift();
	                                                var maskedElement = '';
	                                                if (elementToBeMasked.length > keepLastChars) {
	                                                    var count = elementToBeMasked.length - keepLastChars;
	                                                    if (elementToBeMasked.indexOf("\"") == -1) {
	                                                        //element to be masked is an integer
	                                                        for (var a = 0; a < count; a++) {
	                                                            if (!maskingStr) {
	                                                                maskingStr = '*';
	                                                            } else {
	                                                                maskingStr = maskingStr + '*';
	                                                            }
	                                                        }
	                                                        maskedElement = "\"" + elementToBeMasked.replace(elementToBeMasked.substring(0, count), maskingStr) + "\"";
	                                                        maskingStr = '';
	                                                    } else {
	                                                        //element to be masked is a string
	                                                        for (var a = 0; a < count - 2; a++) {
	                                                            if (!maskingStr) {
	                                                                maskingStr = '*';
	                                                            } else {
	                                                                maskingStr = maskingStr + '*';
	                                                            }
	                                                        }
	                                                        maskedElement = "\"" + elementToBeMasked.replace(elementToBeMasked.substring(0, count - 1), maskingStr);
	                                                        maskingStr = '';
	                                                    }
	                                                } else {
	                                                    //elementToBeMasked.length <= keepLastChars
	                                                    maskedElement = elementToBeMasked;
	                                                }
	                                                //Replace the masked String in the parent json
	                                                strJSON = strJSON.replace(matchesAttrArr[k], prefix + "#text\":" + maskedElement + "}");
	                                            }
	                                        }
	                                        listOfElements.push(attrArrMatch[j]);
	                                    }
	                                }
	                            }
	                        } else {
	                            //Element to be masked is a single object and contains Attribute
	                            var arrRegExPatternJSON = '"' + tagToMask + '":{' + '(.*?)' + '#text' + '(.*?)' + '(,|})';
	                            var attrMatch = strJSON.match(new RegExp(arrRegExPatternJSON, 'g'));
	                            if (attrMatch) {
	                                for (var j = 0; j < attrMatch.length; j++) {
	                                    if (listOfElements.indexOf(attrMatch[j]) == -1) {
	                                        var prefix = attrMatch[j].substring(0, attrMatch[j].indexOf("#text\":"));
	                                        var elementToBeMasked = attrMatch[j].split("#text\":").pop().split("}").shift();
	                                        var maskedElement = '';
	                                        if (elementToBeMasked.length > keepLastChars) {
	                                            var count = elementToBeMasked.length - keepLastChars;
	                                            if (elementToBeMasked.indexOf("\"") == -1) {
	                                                //element to be masked is an integer												
	                                                for (var a = 0; a < count; a++) {
	                                                    if (!maskingStr) {
	                                                        maskingStr = '*';
	                                                    } else {
	                                                        maskingStr = maskingStr + '*';
	                                                    }
	                                                }
	                                                maskedElement = "\"" + elementToBeMasked.replace(elementToBeMasked.substring(0, count), maskingStr) + "\"";
	                                                maskingStr = '';
	                                            } else {
	                                                //element to be masked is a string												
	                                                for (var a = 0; a < count - 2; a++) {
	                                                    if (!maskingStr) {
	                                                        maskingStr = '*';
	                                                    } else {
	                                                        maskingStr = maskingStr + '*';
	                                                    }
	                                                }
	                                                maskedElement = "\"" + elementToBeMasked.replace(elementToBeMasked.substring(0, count - 1), maskingStr);
	                                                maskingStr = '';
	                                            }
	                                        } else {
	                                            //elementToBeMasked.length <= keepLastChars
	                                            maskedElement = elementToBeMasked;
	                                        }
	                                        listOfElements.push(attrMatch[j]);
	                                        //Replace the masked String in the parent json
	                                        strJSON = strJSON.replace(attrMatch[j], prefix + "#text\":" + maskedElement + "}");
	                                    }
	                                }
	                            }
	                        }
	                    } else {
	                        //Element to be masked doesnt contain an attribute
	                        if (tagMatch[i].indexOf('[') > -1) {
	                            //Element to be masked is an array
	                            var arrRegExPatternJSON = '"' + tagToMask + '":' + '\\[' + '(.*?)' + '\\]';
	                            var arrMatch = strJSON.match(new RegExp(arrRegExPatternJSON, 'g'));
	                            if (arrMatch) {
	                                for (var j = 0; j < arrMatch.length; j++) {
	                                    //Condition to extract only Array with no attributes
	                                    if (arrMatch[j].indexOf('{') == -1) {
	                                        if (listOfElements.indexOf(arrMatch[j]) == -1) {
	                                            listOfElements.push(arrMatch[j]);
	                                            var txtcount = arrMatch[j].split("\"").length - 1;
	                                            if (txtcount > 2) {
	                                                //Array of Strings
	                                                var strArr = arrMatch[j].split("[").pop().split("]").shift();
	                                                var arrElem = strArr.split(",");
	                                                var maskedElement = '';
	                                                for (var k = 0; k < arrElem.length; k++) {

	                                                    var count = 1;
	                                                    if (arrElem[k].length > keepLastChars) {
	                                                        count = arrElem[k].length - keepLastChars - 1;
	                                                    }
	                                                    for (var a = 0; a < count - 1; a++) {
	                                                        if (!maskingStr) {
	                                                            maskingStr = '*';
	                                                        } else {
	                                                            maskingStr = maskingStr + '*';
	                                                        }
	                                                    }
	                                                    maskedElement = maskedElement + arrElem[k].replace(arrElem[k].substring(1, count), maskingStr);
	                                                    maskingStr = '';
	                                                    if (k != arrElem.length - 1) {
	                                                        maskedElement = maskedElement + ",";
	                                                    }
	                                                }
	                                                //Replace the masked String in the parent json
	                                                strJSON = strJSON.replace(arrMatch[j], "\"" + tagToMask + "\": [" + maskedElement + "]");
	                                            } else {
	                                                //Array of Integers
	                                                var intArr = arrMatch[j].split("[").pop().split("]").shift();
	                                                var arrElem = intArr.split(",");
	                                                var maskedElement = '[';
	                                                for (var k = 0; k < arrElem.length; k++) {
	                                                    var count = 1;
	                                                    if (arrElem[k].length > keepLastChars) {
	                                                        count = arrElem[k].length - keepLastChars;
	                                                    }

	                                                    for (var a = 0; a < count; a++) {
	                                                        if (!maskingStr) {
	                                                            maskingStr = '*';
	                                                        } else {
	                                                            maskingStr = maskingStr + '*';
	                                                        }
	                                                    }
	                                                    maskedElement = maskedElement + "\"" + arrElem[k].replace(arrElem[k].substring(0, count), maskingStr) + "\"";
	                                                    maskingStr = '';
	                                                    if (k != arrElem.length - 1) {
	                                                        maskedElement = maskedElement + ",";
	                                                    }
	                                                }
	                                                maskedElement = maskedElement + "]";
	                                                //Replace the masked String in the parent json
	                                                strJSON = strJSON.replace(arrMatch[j], "\"" + tagToMask + "\": " + maskedElement);
	                                            }
	                                        }
	                                    }
	                                }
	                            }
	                        } else {
	                            //Element to be masked is a single object
	                            var txtcount = tagMatch[i].split("\"").length - 1;
	                            if (txtcount == 4) {
	                                //Element is a String
	                                var elementToMask = tagMatch[i].substring(tagMatch[i].indexOf(":") + 1);

	                                var count = 1;
	                                if (elementToMask.length > keepLastChars) {
	                                    count = elementToMask.length - keepLastChars - 2;
	                                }

	                                for (var a = 0; a < count - 1; a++) {
	                                    if (!maskingStr) {
	                                        maskingStr = '*';
	                                    } else {
	                                        maskingStr = maskingStr + '*';
	                                    }
	                                }

	                                var maskedElement = elementToMask.replace(elementToMask.substring(0, count), maskingStr);
	                                maskingStr = '';
	                                maskedElement = maskedElement.substring(0, maskedElement.length - 1) + elementToMask.substring(elementToMask.length - 1);
	                                strJSON = strJSON.replace(tagMatch[i], "\"" + tagToMask + "\": \"" + maskedElement);
	                            } else {
	                                //Element is an Integer
	                                var elementToMask = tagMatch[i].substring(tagMatch[i].indexOf(":") + 1);
	                                var count = 1;
	                                if (elementToMask.length > keepLastChars) {
	                                    count = elementToMask.length - keepLastChars - 1;
	                                }
	                                for (var a = 0; a < count; a++) {
	                                    if (!maskingStr) {
	                                        maskingStr = '*';
	                                    } else {
	                                        maskingStr = maskingStr + '*';
	                                    }
	                                }

	                                var maskedElement = elementToMask.replace(elementToMask.substring(0, count), maskingStr);
	                                maskingStr = '';
	                                maskedElement = maskedElement.substring(0, maskedElement.length - 1) + '\"' + elementToMask.substring(elementToMask.length - 1);
	                                //Replace the masked String in the parent json
	                                strJSON = strJSON.replace(tagMatch[i], "\"" + tagToMask + "\": \"" + maskedElement);
	                            }
	                        }
	                    }
	                }
	            }

	            var attrRegExPatternJSON = '"@' + tagToMask + '":"' + '(.*?)' + '"';
	            tagMatch = strJSON.match(new RegExp(attrRegExPatternJSON, 'g'));
	            if (tagMatch) {
	                for (var i = 0; i < tagMatch.length; i++) {
	                    var attrElem = tagMatch[i].split("\"");
	                    var elementToMask = attrElem[3];
	                    var count = 1;
	                    if (elementToMask.length > keepLastChars) {
	                        count = elementToMask.length - keepLastChars;
	                    }
	                    for (var a = 0; a < count; a++) {
	                        if (!maskingStr) {
	                            maskingStr = '*';
	                        } else {
	                            maskingStr = maskingStr + '*';
	                        }
	                    }

	                    var maskedElement = elementToMask.replace(elementToMask.substring(0, count), maskingStr);
	                    maskingStr = '';
	                    strJSON = strJSON.replace(tagMatch[i], "\"@" + tagToMask + "\":\"" + maskedElement + "\"");

	                }
	            }
	        }
	    }

	    return strJSON;
	}