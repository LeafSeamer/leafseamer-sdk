import {requireStatic as require} from "./helpers.mjs";
"use strict";
export const selection = validate53;
const schema20 = {"type":"object","properties":{"contract_id":{"const":"leafseamer.api.v1.events2"},"contract_digest":{"type":"string","pattern":"^sha256:[0-9a-f]{64}$","minLength":71,"maxLength":71}},"required":["contract_id","contract_digest"],"additionalProperties":false};
const func0 = Object.prototype.hasOwnProperty;
const func64 = require("ajv/dist/runtime/ucs2length").default;
const pattern3 = new RegExp("^sha256:[0-9a-f]{64}$", "u");

function validate53(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate53.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.contract_id === undefined) || (!(func0.call(data, "contract_id")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contract_id"},message:"must have required property '"+"contract_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.contract_digest === undefined) || (!(func0.call(data, "contract_digest")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contract_digest"},message:"must have required property '"+"contract_digest"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((key0 === "contract_id") || (key0 === "contract_digest"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.contract_id !== undefined && func0.call(data, "contract_id")){
if("leafseamer.api.v1.events2" !== data.contract_id){
const err3 = {instancePath:instancePath+"/contract_id",schemaPath:"#/properties/contract_id/const",keyword:"const",params:{allowedValue: "leafseamer.api.v1.events2"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.contract_digest !== undefined && func0.call(data, "contract_digest")){
let data1 = data.contract_digest;
if(typeof data1 === "string"){
if(func64(data1) > 71){
const err4 = {instancePath:instancePath+"/contract_digest",schemaPath:"#/properties/contract_digest/maxLength",keyword:"maxLength",params:{limit: 71},message:"must NOT have more than 71 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(func64(data1) < 71){
const err5 = {instancePath:instancePath+"/contract_digest",schemaPath:"#/properties/contract_digest/minLength",keyword:"minLength",params:{limit: 71},message:"must NOT have fewer than 71 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(!pattern3.test(data1)){
const err6 = {instancePath:instancePath+"/contract_digest",schemaPath:"#/properties/contract_digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/contract_digest",schemaPath:"#/properties/contract_digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
else {
const err8 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
validate53.errors = vErrors;
return errors === 0;
}
validate53.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

export const client_frame = validate54;
const schema21 = {"oneOf":[{"$ref":"#/$defs/channel__ClientAttach"},{"$ref":"#/$defs/channel__SnapshotApplied"},{"$ref":"#/$defs/channel__ClientAck"}]};
const schema22 = {"type":"object","properties":{"schema_version":{"const":"event-channel/0.1.0-draft.1"},"type":{"const":"client.attach"},"subscription_id":{"$ref":"#/$defs/channel__Id"},"owner":{"$ref":"#/$defs/channel__Owner"},"stream_id":{"$ref":"#/$defs/channel__Id"},"stream_epoch":{"$ref":"#/$defs/channel__Id"},"scope_digest":{"$ref":"#/$defs/channel__Digest"},"authorization_revision":{"$ref":"#/$defs/channel__Counter"},"expected_connection_generation":{"$ref":"#/$defs/channel__Counter"},"replace_existing":{"type":"boolean"},"resume":{"anyOf":[{"$ref":"#/$defs/channel__Resume"},{"type":"null"}]},"connection_attempt_id":{"$ref":"#/$defs/channel__Id"}},"required":["schema_version","type","subscription_id","owner","stream_id","stream_epoch","scope_digest","authorization_revision","expected_connection_generation","replace_existing","resume","connection_attempt_id"],"additionalProperties":false};
const schema23 = {"type":"string","pattern":"^[A-Za-z0-9_-]{1,128}(?![\\s\\S])","maxLength":128};
const pattern4 = new RegExp("^[A-Za-z0-9_-]{1,128}(?![\\s\\S])", "u");

function validate56(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate56.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func64(data) > 128){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(!pattern4.test(data)){
const err1 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]{1,128}(?![\\s\\S])"},message:"must match pattern \""+"^[A-Za-z0-9_-]{1,128}(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
else {
const err2 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
validate56.errors = vErrors;
return errors === 0;
}
validate56.evaluated = {"dynamicProps":false,"dynamicItems":false};

const schema24 = {"oneOf":[{"$ref":"#/$defs/channel__HumanOwner"},{"$ref":"#/$defs/channel__ServiceOwner"}]};
const schema25 = {"type":"object","properties":{"kind":{"const":"human"},"issuer_id":{"$ref":"#/$defs/channel__Id"},"issuer_epoch":{"$ref":"#/$defs/channel__Id"},"principal_id":{"$ref":"#/$defs/channel__Id"},"session_id":{"$ref":"#/$defs/channel__Id"},"client_instance_id":{"$ref":"#/$defs/channel__Id"}},"required":["kind","issuer_id","issuer_epoch","principal_id","session_id","client_instance_id"],"additionalProperties":false};

function validate59(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate59.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.kind === undefined) || (!(func0.call(data, "kind")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.issuer_id === undefined) || (!(func0.call(data, "issuer_id")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "issuer_id"},message:"must have required property '"+"issuer_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.issuer_epoch === undefined) || (!(func0.call(data, "issuer_epoch")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "issuer_epoch"},message:"must have required property '"+"issuer_epoch"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.principal_id === undefined) || (!(func0.call(data, "principal_id")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "principal_id"},message:"must have required property '"+"principal_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.session_id === undefined) || (!(func0.call(data, "session_id")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "session_id"},message:"must have required property '"+"session_id"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.client_instance_id === undefined) || (!(func0.call(data, "client_instance_id")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "client_instance_id"},message:"must have required property '"+"client_instance_id"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((((((key0 === "kind") || (key0 === "issuer_id")) || (key0 === "issuer_epoch")) || (key0 === "principal_id")) || (key0 === "session_id")) || (key0 === "client_instance_id"))){
const err6 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.kind !== undefined && func0.call(data, "kind")){
if("human" !== data.kind){
const err7 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "human"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.issuer_id !== undefined && func0.call(data, "issuer_id")){
if(!(validate56.call(this, data.issuer_id, {instancePath:instancePath+"/issuer_id",parentData:data,parentDataProperty:"issuer_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
if(data.issuer_epoch !== undefined && func0.call(data, "issuer_epoch")){
if(!(validate56.call(this, data.issuer_epoch, {instancePath:instancePath+"/issuer_epoch",parentData:data,parentDataProperty:"issuer_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
if(data.principal_id !== undefined && func0.call(data, "principal_id")){
if(!(validate56.call(this, data.principal_id, {instancePath:instancePath+"/principal_id",parentData:data,parentDataProperty:"principal_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
if(data.session_id !== undefined && func0.call(data, "session_id")){
if(!(validate56.call(this, data.session_id, {instancePath:instancePath+"/session_id",parentData:data,parentDataProperty:"session_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
if(data.client_instance_id !== undefined && func0.call(data, "client_instance_id")){
if(!(validate56.call(this, data.client_instance_id, {instancePath:instancePath+"/client_instance_id",parentData:data,parentDataProperty:"client_instance_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
}
else {
const err8 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
validate59.errors = vErrors;
return errors === 0;
}
validate59.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema26 = {"type":"object","properties":{"issuer_id":{"$ref":"#/$defs/channel__Id"},"issuer_epoch":{"$ref":"#/$defs/channel__Id"},"principal_id":{"$ref":"#/$defs/channel__Id"},"consumer_service_id":{"$ref":"#/$defs/channel__Id"},"consumer_database_instance_id":{"$ref":"#/$defs/channel__Id"},"consumer_id":{"$ref":"#/$defs/channel__Id"},"pairing_id":{"$ref":"#/$defs/channel__Id"},"kind":{"const":"service"}},"required":["issuer_id","issuer_epoch","principal_id","consumer_service_id","consumer_database_instance_id","consumer_id","pairing_id","kind"],"additionalProperties":false};

function validate66(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate66.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.issuer_id === undefined) || (!(func0.call(data, "issuer_id")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "issuer_id"},message:"must have required property '"+"issuer_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.issuer_epoch === undefined) || (!(func0.call(data, "issuer_epoch")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "issuer_epoch"},message:"must have required property '"+"issuer_epoch"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.principal_id === undefined) || (!(func0.call(data, "principal_id")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "principal_id"},message:"must have required property '"+"principal_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.consumer_service_id === undefined) || (!(func0.call(data, "consumer_service_id")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "consumer_service_id"},message:"must have required property '"+"consumer_service_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.consumer_database_instance_id === undefined) || (!(func0.call(data, "consumer_database_instance_id")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "consumer_database_instance_id"},message:"must have required property '"+"consumer_database_instance_id"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.consumer_id === undefined) || (!(func0.call(data, "consumer_id")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "consumer_id"},message:"must have required property '"+"consumer_id"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.pairing_id === undefined) || (!(func0.call(data, "pairing_id")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "pairing_id"},message:"must have required property '"+"pairing_id"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if((data.kind === undefined) || (!(func0.call(data, "kind")))){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((((((((key0 === "issuer_id") || (key0 === "issuer_epoch")) || (key0 === "principal_id")) || (key0 === "consumer_service_id")) || (key0 === "consumer_database_instance_id")) || (key0 === "consumer_id")) || (key0 === "pairing_id")) || (key0 === "kind"))){
const err8 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.issuer_id !== undefined && func0.call(data, "issuer_id")){
if(!(validate56.call(this, data.issuer_id, {instancePath:instancePath+"/issuer_id",parentData:data,parentDataProperty:"issuer_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
if(data.issuer_epoch !== undefined && func0.call(data, "issuer_epoch")){
if(!(validate56.call(this, data.issuer_epoch, {instancePath:instancePath+"/issuer_epoch",parentData:data,parentDataProperty:"issuer_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
if(data.principal_id !== undefined && func0.call(data, "principal_id")){
if(!(validate56.call(this, data.principal_id, {instancePath:instancePath+"/principal_id",parentData:data,parentDataProperty:"principal_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
if(data.consumer_service_id !== undefined && func0.call(data, "consumer_service_id")){
if(!(validate56.call(this, data.consumer_service_id, {instancePath:instancePath+"/consumer_service_id",parentData:data,parentDataProperty:"consumer_service_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
if(data.consumer_database_instance_id !== undefined && func0.call(data, "consumer_database_instance_id")){
if(!(validate56.call(this, data.consumer_database_instance_id, {instancePath:instancePath+"/consumer_database_instance_id",parentData:data,parentDataProperty:"consumer_database_instance_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
if(data.consumer_id !== undefined && func0.call(data, "consumer_id")){
if(!(validate56.call(this, data.consumer_id, {instancePath:instancePath+"/consumer_id",parentData:data,parentDataProperty:"consumer_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
if(data.pairing_id !== undefined && func0.call(data, "pairing_id")){
if(!(validate56.call(this, data.pairing_id, {instancePath:instancePath+"/pairing_id",parentData:data,parentDataProperty:"pairing_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
if(data.kind !== undefined && func0.call(data, "kind")){
if("service" !== data.kind){
const err9 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "service"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
else {
const err10 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
validate66.errors = vErrors;
return errors === 0;
}
validate66.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate58(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate58.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs0 = errors;
let valid0 = false;
let passing0 = null;
const _errs1 = errors;
if(!(validate59.call(this, data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate59.errors : vErrors.concat(validate59.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
if(!(validate66.call(this, data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate66.errors : vErrors.concat(validate66.errors);
errors = vErrors.length;
}
var _valid0 = _errs2 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid0 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
}
if(!valid0){
const err0 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
else {
errors = _errs0;
if(vErrors !== null){
if(_errs0){
vErrors.length = _errs0;
}
else {
vErrors = null;
}
}
}
validate58.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate58.evaluated = {"dynamicProps":true,"dynamicItems":false};

const schema27 = {"type":"string","pattern":"^[0-9a-f]{64}(?![\\s\\S])","maxLength":64};
const pattern5 = new RegExp("^[0-9a-f]{64}(?![\\s\\S])", "u");

function validate78(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate78.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func64(data) > 64){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 64},message:"must NOT have more than 64 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(!pattern5.test(data)){
const err1 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}(?![\\s\\S])"},message:"must match pattern \""+"^[0-9a-f]{64}(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
else {
const err2 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
validate78.errors = vErrors;
return errors === 0;
}
validate78.evaluated = {"dynamicProps":false,"dynamicItems":false};

const schema28 = {"type":"string","pattern":"^(0|[1-9][0-9]*)(?![\\s\\S])","maxLength":20};
const pattern6 = new RegExp("^(0|[1-9][0-9]*)(?![\\s\\S])", "u");

function validate80(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate80.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func64(data) > 20){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 20},message:"must NOT have more than 20 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(!pattern6.test(data)){
const err1 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)(?![\\s\\S])"},message:"must match pattern \""+"^(0|[1-9][0-9]*)(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
else {
const err2 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
validate80.errors = vErrors;
return errors === 0;
}
validate80.evaluated = {"dynamicProps":false,"dynamicItems":false};

const schema29 = {"type":"object","properties":{"cursor":{"$ref":"#/$defs/channel__Counter"},"payload_digest":{"$ref":"#/$defs/channel__Digest"},"ack_kind":{"$ref":"#/$defs/channel__AckKind"}},"required":["cursor","payload_digest","ack_kind"],"additionalProperties":false};
const schema30 = {"enum":["projection_applied","durable_ingest"]};

function validate86(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate86.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!((data === "projection_applied") || (data === "durable_ingest"))){
const err0 = {instancePath,schemaPath:"#/enum",keyword:"enum",params:{allowedValues: schema30.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
validate86.errors = vErrors;
return errors === 0;
}
validate86.evaluated = {"dynamicProps":false,"dynamicItems":false};


function validate83(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate83.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.cursor === undefined) || (!(func0.call(data, "cursor")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "cursor"},message:"must have required property '"+"cursor"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.payload_digest === undefined) || (!(func0.call(data, "payload_digest")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "payload_digest"},message:"must have required property '"+"payload_digest"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.ack_kind === undefined) || (!(func0.call(data, "ack_kind")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "ack_kind"},message:"must have required property '"+"ack_kind"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(((key0 === "cursor") || (key0 === "payload_digest")) || (key0 === "ack_kind"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.cursor !== undefined && func0.call(data, "cursor")){
if(!(validate80.call(this, data.cursor, {instancePath:instancePath+"/cursor",parentData:data,parentDataProperty:"cursor",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate80.errors : vErrors.concat(validate80.errors);
errors = vErrors.length;
}
}
if(data.payload_digest !== undefined && func0.call(data, "payload_digest")){
if(!(validate78.call(this, data.payload_digest, {instancePath:instancePath+"/payload_digest",parentData:data,parentDataProperty:"payload_digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate78.errors : vErrors.concat(validate78.errors);
errors = vErrors.length;
}
}
if(data.ack_kind !== undefined && func0.call(data, "ack_kind")){
if(!(validate86.call(this, data.ack_kind, {instancePath:instancePath+"/ack_kind",parentData:data,parentDataProperty:"ack_kind",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate86.errors : vErrors.concat(validate86.errors);
errors = vErrors.length;
}
}
}
else {
const err4 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
validate83.errors = vErrors;
return errors === 0;
}
validate83.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate55(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate55.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.schema_version === undefined) || (!(func0.call(data, "schema_version")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "schema_version"},message:"must have required property '"+"schema_version"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.type === undefined) || (!(func0.call(data, "type")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.subscription_id === undefined) || (!(func0.call(data, "subscription_id")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "subscription_id"},message:"must have required property '"+"subscription_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.owner === undefined) || (!(func0.call(data, "owner")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "owner"},message:"must have required property '"+"owner"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.stream_id === undefined) || (!(func0.call(data, "stream_id")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stream_id"},message:"must have required property '"+"stream_id"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.stream_epoch === undefined) || (!(func0.call(data, "stream_epoch")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stream_epoch"},message:"must have required property '"+"stream_epoch"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.scope_digest === undefined) || (!(func0.call(data, "scope_digest")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope_digest"},message:"must have required property '"+"scope_digest"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if((data.authorization_revision === undefined) || (!(func0.call(data, "authorization_revision")))){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "authorization_revision"},message:"must have required property '"+"authorization_revision"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if((data.expected_connection_generation === undefined) || (!(func0.call(data, "expected_connection_generation")))){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "expected_connection_generation"},message:"must have required property '"+"expected_connection_generation"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if((data.replace_existing === undefined) || (!(func0.call(data, "replace_existing")))){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "replace_existing"},message:"must have required property '"+"replace_existing"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if((data.resume === undefined) || (!(func0.call(data, "resume")))){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "resume"},message:"must have required property '"+"resume"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if((data.connection_attempt_id === undefined) || (!(func0.call(data, "connection_attempt_id")))){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "connection_attempt_id"},message:"must have required property '"+"connection_attempt_id"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(func0.call(schema22.properties, key0))){
const err12 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.schema_version !== undefined && func0.call(data, "schema_version")){
if("event-channel/0.1.0-draft.1" !== data.schema_version){
const err13 = {instancePath:instancePath+"/schema_version",schemaPath:"#/properties/schema_version/const",keyword:"const",params:{allowedValue: "event-channel/0.1.0-draft.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.type !== undefined && func0.call(data, "type")){
if("client.attach" !== data.type){
const err14 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/const",keyword:"const",params:{allowedValue: "client.attach"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.subscription_id !== undefined && func0.call(data, "subscription_id")){
if(!(validate56.call(this, data.subscription_id, {instancePath:instancePath+"/subscription_id",parentData:data,parentDataProperty:"subscription_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
if(data.owner !== undefined && func0.call(data, "owner")){
if(!(validate58.call(this, data.owner, {instancePath:instancePath+"/owner",parentData:data,parentDataProperty:"owner",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
errors = vErrors.length;
}
}
if(data.stream_id !== undefined && func0.call(data, "stream_id")){
if(!(validate56.call(this, data.stream_id, {instancePath:instancePath+"/stream_id",parentData:data,parentDataProperty:"stream_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
if(data.stream_epoch !== undefined && func0.call(data, "stream_epoch")){
if(!(validate56.call(this, data.stream_epoch, {instancePath:instancePath+"/stream_epoch",parentData:data,parentDataProperty:"stream_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
if(data.scope_digest !== undefined && func0.call(data, "scope_digest")){
if(!(validate78.call(this, data.scope_digest, {instancePath:instancePath+"/scope_digest",parentData:data,parentDataProperty:"scope_digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate78.errors : vErrors.concat(validate78.errors);
errors = vErrors.length;
}
}
if(data.authorization_revision !== undefined && func0.call(data, "authorization_revision")){
if(!(validate80.call(this, data.authorization_revision, {instancePath:instancePath+"/authorization_revision",parentData:data,parentDataProperty:"authorization_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate80.errors : vErrors.concat(validate80.errors);
errors = vErrors.length;
}
}
if(data.expected_connection_generation !== undefined && func0.call(data, "expected_connection_generation")){
if(!(validate80.call(this, data.expected_connection_generation, {instancePath:instancePath+"/expected_connection_generation",parentData:data,parentDataProperty:"expected_connection_generation",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate80.errors : vErrors.concat(validate80.errors);
errors = vErrors.length;
}
}
if(data.replace_existing !== undefined && func0.call(data, "replace_existing")){
if(typeof data.replace_existing !== "boolean"){
const err15 = {instancePath:instancePath+"/replace_existing",schemaPath:"#/properties/replace_existing/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.resume !== undefined && func0.call(data, "resume")){
let data10 = data.resume;
const _errs14 = errors;
let valid1 = false;
const _errs15 = errors;
if(!(validate83.call(this, data10, {instancePath:instancePath+"/resume",parentData:data,parentDataProperty:"resume",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate83.errors : vErrors.concat(validate83.errors);
errors = vErrors.length;
}
var _valid0 = _errs15 === errors;
valid1 = valid1 || _valid0;
const _errs16 = errors;
if(data10 !== null){
const err16 = {instancePath:instancePath+"/resume",schemaPath:"#/properties/resume/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
var _valid0 = _errs16 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err17 = {instancePath:instancePath+"/resume",schemaPath:"#/properties/resume/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
else {
errors = _errs14;
if(vErrors !== null){
if(_errs14){
vErrors.length = _errs14;
}
else {
vErrors = null;
}
}
}
}
if(data.connection_attempt_id !== undefined && func0.call(data, "connection_attempt_id")){
if(!(validate56.call(this, data.connection_attempt_id, {instancePath:instancePath+"/connection_attempt_id",parentData:data,parentDataProperty:"connection_attempt_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
}
else {
const err18 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
validate55.errors = vErrors;
return errors === 0;
}
validate55.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema31 = {"type":"object","properties":{"schema_version":{"const":"event-channel/0.1.0-draft.1"},"type":{"const":"client.snapshot.applied"},"binding":{"$ref":"#/$defs/channel__DeliveryBinding"},"snapshot":{"$ref":"#/$defs/channel__SnapshotRef"}},"required":["schema_version","type","binding","snapshot"],"additionalProperties":false};
const schema32 = {"type":"object","properties":{"subscription_id":{"$ref":"#/$defs/snapshot__Id"},"publisher_service_id":{"$ref":"#/$defs/snapshot__Id"},"publisher_database_instance_id":{"$ref":"#/$defs/snapshot__Id"},"stream_id":{"$ref":"#/$defs/snapshot__Id"},"stream_epoch":{"$ref":"#/$defs/snapshot__Id"},"scope_digest":{"$ref":"#/$defs/snapshot__Digest"},"authorization_revision":{"$ref":"#/$defs/snapshot__Counter"},"connection_generation":{"$ref":"#/$defs/snapshot__Counter"}},"required":["subscription_id","publisher_service_id","publisher_database_instance_id","stream_id","stream_epoch","scope_digest","authorization_revision","connection_generation"],"additionalProperties":false};

function validate93(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate93.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func64(data) > 128){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(!pattern4.test(data)){
const err1 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]{1,128}(?![\\s\\S])"},message:"must match pattern \""+"^[A-Za-z0-9_-]{1,128}(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
else {
const err2 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
validate93.errors = vErrors;
return errors === 0;
}
validate93.evaluated = {"dynamicProps":false,"dynamicItems":false};


function validate99(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate99.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func64(data) > 64){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 64},message:"must NOT have more than 64 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(!pattern5.test(data)){
const err1 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^[0-9a-f]{64}(?![\\s\\S])"},message:"must match pattern \""+"^[0-9a-f]{64}(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
else {
const err2 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
validate99.errors = vErrors;
return errors === 0;
}
validate99.evaluated = {"dynamicProps":false,"dynamicItems":false};


function validate101(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate101.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func64(data) > 20){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 20},message:"must NOT have more than 20 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(!pattern6.test(data)){
const err1 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)(?![\\s\\S])"},message:"must match pattern \""+"^(0|[1-9][0-9]*)(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
else {
const err2 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
validate101.errors = vErrors;
return errors === 0;
}
validate101.evaluated = {"dynamicProps":false,"dynamicItems":false};


function validate92(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate92.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.subscription_id === undefined) || (!(func0.call(data, "subscription_id")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "subscription_id"},message:"must have required property '"+"subscription_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.publisher_service_id === undefined) || (!(func0.call(data, "publisher_service_id")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publisher_service_id"},message:"must have required property '"+"publisher_service_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.publisher_database_instance_id === undefined) || (!(func0.call(data, "publisher_database_instance_id")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publisher_database_instance_id"},message:"must have required property '"+"publisher_database_instance_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.stream_id === undefined) || (!(func0.call(data, "stream_id")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stream_id"},message:"must have required property '"+"stream_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.stream_epoch === undefined) || (!(func0.call(data, "stream_epoch")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stream_epoch"},message:"must have required property '"+"stream_epoch"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.scope_digest === undefined) || (!(func0.call(data, "scope_digest")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope_digest"},message:"must have required property '"+"scope_digest"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.authorization_revision === undefined) || (!(func0.call(data, "authorization_revision")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "authorization_revision"},message:"must have required property '"+"authorization_revision"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if((data.connection_generation === undefined) || (!(func0.call(data, "connection_generation")))){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "connection_generation"},message:"must have required property '"+"connection_generation"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((((((((key0 === "subscription_id") || (key0 === "publisher_service_id")) || (key0 === "publisher_database_instance_id")) || (key0 === "stream_id")) || (key0 === "stream_epoch")) || (key0 === "scope_digest")) || (key0 === "authorization_revision")) || (key0 === "connection_generation"))){
const err8 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.subscription_id !== undefined && func0.call(data, "subscription_id")){
if(!(validate93.call(this, data.subscription_id, {instancePath:instancePath+"/subscription_id",parentData:data,parentDataProperty:"subscription_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.publisher_service_id !== undefined && func0.call(data, "publisher_service_id")){
if(!(validate93.call(this, data.publisher_service_id, {instancePath:instancePath+"/publisher_service_id",parentData:data,parentDataProperty:"publisher_service_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.publisher_database_instance_id !== undefined && func0.call(data, "publisher_database_instance_id")){
if(!(validate93.call(this, data.publisher_database_instance_id, {instancePath:instancePath+"/publisher_database_instance_id",parentData:data,parentDataProperty:"publisher_database_instance_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.stream_id !== undefined && func0.call(data, "stream_id")){
if(!(validate93.call(this, data.stream_id, {instancePath:instancePath+"/stream_id",parentData:data,parentDataProperty:"stream_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.stream_epoch !== undefined && func0.call(data, "stream_epoch")){
if(!(validate93.call(this, data.stream_epoch, {instancePath:instancePath+"/stream_epoch",parentData:data,parentDataProperty:"stream_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.scope_digest !== undefined && func0.call(data, "scope_digest")){
if(!(validate99.call(this, data.scope_digest, {instancePath:instancePath+"/scope_digest",parentData:data,parentDataProperty:"scope_digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate99.errors : vErrors.concat(validate99.errors);
errors = vErrors.length;
}
}
if(data.authorization_revision !== undefined && func0.call(data, "authorization_revision")){
if(!(validate101.call(this, data.authorization_revision, {instancePath:instancePath+"/authorization_revision",parentData:data,parentDataProperty:"authorization_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.connection_generation !== undefined && func0.call(data, "connection_generation")){
if(!(validate101.call(this, data.connection_generation, {instancePath:instancePath+"/connection_generation",parentData:data,parentDataProperty:"connection_generation",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
}
else {
const err9 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
validate92.errors = vErrors;
return errors === 0;
}
validate92.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema36 = {"type":"object","properties":{"snapshot_id":{"$ref":"#/$defs/channel__Id"},"manifest_digest":{"$ref":"#/$defs/channel__Digest"},"snapshot_cursor":{"$ref":"#/$defs/channel__Counter"}},"required":["snapshot_id","manifest_digest","snapshot_cursor"],"additionalProperties":false};

function validate105(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate105.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.snapshot_id === undefined) || (!(func0.call(data, "snapshot_id")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot_id"},message:"must have required property '"+"snapshot_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.manifest_digest === undefined) || (!(func0.call(data, "manifest_digest")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "manifest_digest"},message:"must have required property '"+"manifest_digest"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.snapshot_cursor === undefined) || (!(func0.call(data, "snapshot_cursor")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot_cursor"},message:"must have required property '"+"snapshot_cursor"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(((key0 === "snapshot_id") || (key0 === "manifest_digest")) || (key0 === "snapshot_cursor"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.snapshot_id !== undefined && func0.call(data, "snapshot_id")){
if(!(validate56.call(this, data.snapshot_id, {instancePath:instancePath+"/snapshot_id",parentData:data,parentDataProperty:"snapshot_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
if(data.manifest_digest !== undefined && func0.call(data, "manifest_digest")){
if(!(validate78.call(this, data.manifest_digest, {instancePath:instancePath+"/manifest_digest",parentData:data,parentDataProperty:"manifest_digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate78.errors : vErrors.concat(validate78.errors);
errors = vErrors.length;
}
}
if(data.snapshot_cursor !== undefined && func0.call(data, "snapshot_cursor")){
if(!(validate80.call(this, data.snapshot_cursor, {instancePath:instancePath+"/snapshot_cursor",parentData:data,parentDataProperty:"snapshot_cursor",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate80.errors : vErrors.concat(validate80.errors);
errors = vErrors.length;
}
}
}
else {
const err4 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
validate105.errors = vErrors;
return errors === 0;
}
validate105.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate91(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate91.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.schema_version === undefined) || (!(func0.call(data, "schema_version")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "schema_version"},message:"must have required property '"+"schema_version"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.type === undefined) || (!(func0.call(data, "type")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.binding === undefined) || (!(func0.call(data, "binding")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "binding"},message:"must have required property '"+"binding"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.snapshot === undefined) || (!(func0.call(data, "snapshot")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot"},message:"must have required property '"+"snapshot"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((((key0 === "schema_version") || (key0 === "type")) || (key0 === "binding")) || (key0 === "snapshot"))){
const err4 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.schema_version !== undefined && func0.call(data, "schema_version")){
if("event-channel/0.1.0-draft.1" !== data.schema_version){
const err5 = {instancePath:instancePath+"/schema_version",schemaPath:"#/properties/schema_version/const",keyword:"const",params:{allowedValue: "event-channel/0.1.0-draft.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.type !== undefined && func0.call(data, "type")){
if("client.snapshot.applied" !== data.type){
const err6 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/const",keyword:"const",params:{allowedValue: "client.snapshot.applied"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.binding !== undefined && func0.call(data, "binding")){
if(!(validate92.call(this, data.binding, {instancePath:instancePath+"/binding",parentData:data,parentDataProperty:"binding",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate92.errors : vErrors.concat(validate92.errors);
errors = vErrors.length;
}
}
if(data.snapshot !== undefined && func0.call(data, "snapshot")){
if(!(validate105.call(this, data.snapshot, {instancePath:instancePath+"/snapshot",parentData:data,parentDataProperty:"snapshot",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate105.errors : vErrors.concat(validate105.errors);
errors = vErrors.length;
}
}
}
else {
const err7 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
validate91.errors = vErrors;
return errors === 0;
}
validate91.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema37 = {"type":"object","properties":{"schema_version":{"const":"event-channel/0.1.0-draft.1"},"type":{"const":"client.ack"},"binding":{"$ref":"#/$defs/channel__DeliveryBinding"},"cursor":{"$ref":"#/$defs/channel__Counter"},"payload_digest":{"$ref":"#/$defs/channel__Digest"},"ack_kind":{"$ref":"#/$defs/channel__AckKind"}},"required":["schema_version","type","binding","cursor","payload_digest","ack_kind"],"additionalProperties":false};

function validate111(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate111.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.schema_version === undefined) || (!(func0.call(data, "schema_version")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "schema_version"},message:"must have required property '"+"schema_version"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.type === undefined) || (!(func0.call(data, "type")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.binding === undefined) || (!(func0.call(data, "binding")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "binding"},message:"must have required property '"+"binding"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.cursor === undefined) || (!(func0.call(data, "cursor")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "cursor"},message:"must have required property '"+"cursor"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.payload_digest === undefined) || (!(func0.call(data, "payload_digest")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "payload_digest"},message:"must have required property '"+"payload_digest"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.ack_kind === undefined) || (!(func0.call(data, "ack_kind")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "ack_kind"},message:"must have required property '"+"ack_kind"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((((((key0 === "schema_version") || (key0 === "type")) || (key0 === "binding")) || (key0 === "cursor")) || (key0 === "payload_digest")) || (key0 === "ack_kind"))){
const err6 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.schema_version !== undefined && func0.call(data, "schema_version")){
if("event-channel/0.1.0-draft.1" !== data.schema_version){
const err7 = {instancePath:instancePath+"/schema_version",schemaPath:"#/properties/schema_version/const",keyword:"const",params:{allowedValue: "event-channel/0.1.0-draft.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.type !== undefined && func0.call(data, "type")){
if("client.ack" !== data.type){
const err8 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/const",keyword:"const",params:{allowedValue: "client.ack"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.binding !== undefined && func0.call(data, "binding")){
if(!(validate92.call(this, data.binding, {instancePath:instancePath+"/binding",parentData:data,parentDataProperty:"binding",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate92.errors : vErrors.concat(validate92.errors);
errors = vErrors.length;
}
}
if(data.cursor !== undefined && func0.call(data, "cursor")){
if(!(validate80.call(this, data.cursor, {instancePath:instancePath+"/cursor",parentData:data,parentDataProperty:"cursor",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate80.errors : vErrors.concat(validate80.errors);
errors = vErrors.length;
}
}
if(data.payload_digest !== undefined && func0.call(data, "payload_digest")){
if(!(validate78.call(this, data.payload_digest, {instancePath:instancePath+"/payload_digest",parentData:data,parentDataProperty:"payload_digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate78.errors : vErrors.concat(validate78.errors);
errors = vErrors.length;
}
}
if(data.ack_kind !== undefined && func0.call(data, "ack_kind")){
if(!(validate86.call(this, data.ack_kind, {instancePath:instancePath+"/ack_kind",parentData:data,parentDataProperty:"ack_kind",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate86.errors : vErrors.concat(validate86.errors);
errors = vErrors.length;
}
}
}
else {
const err9 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
validate111.errors = vErrors;
return errors === 0;
}
validate111.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate54(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate54.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs0 = errors;
let valid0 = false;
let passing0 = null;
const _errs1 = errors;
if(!(validate55.call(this, data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate55.errors : vErrors.concat(validate55.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
if(!(validate91.call(this, data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate91.errors : vErrors.concat(validate91.errors);
errors = vErrors.length;
}
var _valid0 = _errs2 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid0 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
const _errs3 = errors;
if(!(validate111.call(this, data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate111.errors : vErrors.concat(validate111.errors);
errors = vErrors.length;
}
var _valid0 = _errs3 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid0 = true;
passing0 = 2;
if(props0 !== true){
props0 = true;
}
}
}
}
if(!valid0){
const err0 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
else {
errors = _errs0;
if(vErrors !== null){
if(_errs0){
vErrors.length = _errs0;
}
else {
vErrors = null;
}
}
}
validate54.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate54.evaluated = {"dynamicProps":true,"dynamicItems":false};

export const server_frame = validate117;
const schema38 = {"oneOf":[{"$ref":"#/$defs/channel__Ready"},{"$ref":"#/$defs/channel__ServerAttached"},{"$ref":"#/$defs/channel__SyncReady"},{"$ref":"#/$defs/channel__ResyncRequired"},{"$ref":"#/$defs/snapshot__Data"}]};
const schema39 = {"type":"object","properties":{"type":{"const":"contract.ready"},"channel":{"$ref":"#/$defs/channel__ChannelBinding"}},"required":["type","channel"],"additionalProperties":false};
const schema40 = {"type":"object","properties":{"binding_id":{"$ref":"#/$defs/channel__Id"},"selection":{"$ref":"#/$defs/channel__Selection"},"publisher_service_id":{"$ref":"#/$defs/channel__Id"},"publisher_database_instance_id":{"$ref":"#/$defs/channel__Id"},"service_boot_id":{"$ref":"#/$defs/channel__Id"},"owner":{"$ref":"#/$defs/channel__Owner"},"subscription_id":{"oneOf":[{"$ref":"#/$defs/channel__Id"},{"type":"null"}]},"transport":{"enum":["human_ticket","service_mtls"]}},"required":["binding_id","selection","publisher_service_id","publisher_database_instance_id","service_boot_id","owner","subscription_id","transport"],"additionalProperties":false,"allOf":[{"if":{"properties":{"transport":{"const":"human_ticket"}}},"then":{"properties":{"owner":{"$ref":"#/$defs/channel__HumanOwner"},"subscription_id":{"$ref":"#/$defs/channel__Id"}}},"else":{"properties":{"owner":{"$ref":"#/$defs/channel__ServiceOwner"},"subscription_id":{"type":"null"}}}}]};

function validate124(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate124.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.contract_id === undefined) || (!(func0.call(data, "contract_id")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contract_id"},message:"must have required property '"+"contract_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.contract_digest === undefined) || (!(func0.call(data, "contract_digest")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contract_digest"},message:"must have required property '"+"contract_digest"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((key0 === "contract_id") || (key0 === "contract_digest"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.contract_id !== undefined && func0.call(data, "contract_id")){
if("leafseamer.api.v1.events2" !== data.contract_id){
const err3 = {instancePath:instancePath+"/contract_id",schemaPath:"#/properties/contract_id/const",keyword:"const",params:{allowedValue: "leafseamer.api.v1.events2"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.contract_digest !== undefined && func0.call(data, "contract_digest")){
let data1 = data.contract_digest;
if(typeof data1 === "string"){
if(func64(data1) > 71){
const err4 = {instancePath:instancePath+"/contract_digest",schemaPath:"#/properties/contract_digest/maxLength",keyword:"maxLength",params:{limit: 71},message:"must NOT have more than 71 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(func64(data1) < 71){
const err5 = {instancePath:instancePath+"/contract_digest",schemaPath:"#/properties/contract_digest/minLength",keyword:"minLength",params:{limit: 71},message:"must NOT have fewer than 71 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(!pattern3.test(data1)){
const err6 = {instancePath:instancePath+"/contract_digest",schemaPath:"#/properties/contract_digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/contract_digest",schemaPath:"#/properties/contract_digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
else {
const err8 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
validate124.errors = vErrors;
return errors === 0;
}
validate124.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate119(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate119.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs2 = errors;
let valid1 = true;
const _errs3 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.transport !== undefined && func0.call(data, "transport")){
if("human_ticket" !== data.transport){
const err0 = {};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
}
var _valid0 = _errs3 === errors;
errors = _errs2;
if(vErrors !== null){
if(_errs2){
vErrors.length = _errs2;
}
else {
vErrors = null;
}
}
let ifClause0;
if(_valid0){
const _errs5 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.owner !== undefined && func0.call(data, "owner")){
if(!(validate59.call(this, data.owner, {instancePath:instancePath+"/owner",parentData:data,parentDataProperty:"owner",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate59.errors : vErrors.concat(validate59.errors);
errors = vErrors.length;
}
}
if(data.subscription_id !== undefined && func0.call(data, "subscription_id")){
if(!(validate56.call(this, data.subscription_id, {instancePath:instancePath+"/subscription_id",parentData:data,parentDataProperty:"subscription_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
}
var _valid0 = _errs5 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.owner = true;
props0.subscription_id = true;
props0.transport = true;
}
ifClause0 = "then";
}
else {
const _errs8 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.owner !== undefined && func0.call(data, "owner")){
if(!(validate66.call(this, data.owner, {instancePath:instancePath+"/owner",parentData:data,parentDataProperty:"owner",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate66.errors : vErrors.concat(validate66.errors);
errors = vErrors.length;
}
}
if(data.subscription_id !== undefined && func0.call(data, "subscription_id")){
if(data.subscription_id !== null){
const err1 = {instancePath:instancePath+"/subscription_id",schemaPath:"#/allOf/0/else/properties/subscription_id/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
}
var _valid0 = _errs8 === errors;
valid1 = _valid0;
if(valid1){
if(props0 !== true){
props0 = props0 || {};
props0.owner = true;
props0.subscription_id = true;
}
}
ifClause0 = "else";
}
if(!valid1){
const err2 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: ifClause0},message:"must match \""+ifClause0+"\" schema"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.binding_id === undefined) || (!(func0.call(data, "binding_id")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "binding_id"},message:"must have required property '"+"binding_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.selection === undefined) || (!(func0.call(data, "selection")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "selection"},message:"must have required property '"+"selection"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.publisher_service_id === undefined) || (!(func0.call(data, "publisher_service_id")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publisher_service_id"},message:"must have required property '"+"publisher_service_id"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.publisher_database_instance_id === undefined) || (!(func0.call(data, "publisher_database_instance_id")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publisher_database_instance_id"},message:"must have required property '"+"publisher_database_instance_id"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if((data.service_boot_id === undefined) || (!(func0.call(data, "service_boot_id")))){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "service_boot_id"},message:"must have required property '"+"service_boot_id"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if((data.owner === undefined) || (!(func0.call(data, "owner")))){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "owner"},message:"must have required property '"+"owner"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if((data.subscription_id === undefined) || (!(func0.call(data, "subscription_id")))){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "subscription_id"},message:"must have required property '"+"subscription_id"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if((data.transport === undefined) || (!(func0.call(data, "transport")))){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "transport"},message:"must have required property '"+"transport"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((((((((key0 === "binding_id") || (key0 === "selection")) || (key0 === "publisher_service_id")) || (key0 === "publisher_database_instance_id")) || (key0 === "service_boot_id")) || (key0 === "owner")) || (key0 === "subscription_id")) || (key0 === "transport"))){
const err11 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.binding_id !== undefined && func0.call(data, "binding_id")){
if(!(validate56.call(this, data.binding_id, {instancePath:instancePath+"/binding_id",parentData:data,parentDataProperty:"binding_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
if(data.selection !== undefined && func0.call(data, "selection")){
if(!(validate124.call(this, data.selection, {instancePath:instancePath+"/selection",parentData:data,parentDataProperty:"selection",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate124.errors : vErrors.concat(validate124.errors);
errors = vErrors.length;
}
}
if(data.publisher_service_id !== undefined && func0.call(data, "publisher_service_id")){
if(!(validate56.call(this, data.publisher_service_id, {instancePath:instancePath+"/publisher_service_id",parentData:data,parentDataProperty:"publisher_service_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
if(data.publisher_database_instance_id !== undefined && func0.call(data, "publisher_database_instance_id")){
if(!(validate56.call(this, data.publisher_database_instance_id, {instancePath:instancePath+"/publisher_database_instance_id",parentData:data,parentDataProperty:"publisher_database_instance_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
if(data.service_boot_id !== undefined && func0.call(data, "service_boot_id")){
if(!(validate56.call(this, data.service_boot_id, {instancePath:instancePath+"/service_boot_id",parentData:data,parentDataProperty:"service_boot_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
if(data.owner !== undefined && func0.call(data, "owner")){
if(!(validate58.call(this, data.owner, {instancePath:instancePath+"/owner",parentData:data,parentDataProperty:"owner",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate58.errors : vErrors.concat(validate58.errors);
errors = vErrors.length;
}
}
if(data.subscription_id !== undefined && func0.call(data, "subscription_id")){
let data11 = data.subscription_id;
const _errs20 = errors;
let valid6 = false;
let passing0 = null;
const _errs21 = errors;
if(!(validate56.call(this, data11, {instancePath:instancePath+"/subscription_id",parentData:data,parentDataProperty:"subscription_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
var _valid1 = _errs21 === errors;
if(_valid1){
valid6 = true;
passing0 = 0;
}
const _errs22 = errors;
if(data11 !== null){
const err12 = {instancePath:instancePath+"/subscription_id",schemaPath:"#/properties/subscription_id/oneOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
var _valid1 = _errs22 === errors;
if(_valid1 && valid6){
valid6 = false;
passing0 = [passing0, 1];
}
else {
if(_valid1){
valid6 = true;
passing0 = 1;
}
}
if(!valid6){
const err13 = {instancePath:instancePath+"/subscription_id",schemaPath:"#/properties/subscription_id/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
else {
errors = _errs20;
if(vErrors !== null){
if(_errs20){
vErrors.length = _errs20;
}
else {
vErrors = null;
}
}
}
}
if(data.transport !== undefined && func0.call(data, "transport")){
let data12 = data.transport;
if(!((data12 === "human_ticket") || (data12 === "service_mtls"))){
const err14 = {instancePath:instancePath+"/transport",schemaPath:"#/properties/transport/enum",keyword:"enum",params:{allowedValues: schema40.properties.transport.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
}
else {
const err15 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
validate119.errors = vErrors;
return errors === 0;
}
validate119.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate118(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate118.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.type === undefined) || (!(func0.call(data, "type")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.channel === undefined) || (!(func0.call(data, "channel")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "channel"},message:"must have required property '"+"channel"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((key0 === "type") || (key0 === "channel"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.type !== undefined && func0.call(data, "type")){
if("contract.ready" !== data.type){
const err3 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/const",keyword:"const",params:{allowedValue: "contract.ready"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.channel !== undefined && func0.call(data, "channel")){
if(!(validate119.call(this, data.channel, {instancePath:instancePath+"/channel",parentData:data,parentDataProperty:"channel",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate119.errors : vErrors.concat(validate119.errors);
errors = vErrors.length;
}
}
}
else {
const err4 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
validate118.errors = vErrors;
return errors === 0;
}
validate118.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema42 = {"type":"object","properties":{"schema_version":{"const":"event-channel/0.1.0-draft.1"},"type":{"const":"server.attached"},"binding":{"$ref":"#/$defs/channel__DeliveryBinding"},"state":{"enum":["building","snapshot_ready","catching_up"]},"snapshot_ref":{"anyOf":[{"$ref":"#/$defs/channel__SnapshotRef"},{"type":"null"}]},"ack_cursor":{"$ref":"#/$defs/channel__Counter"},"ack_payload_digest":{"$ref":"#/$defs/channel__Digest"}},"required":["schema_version","type","binding","state","snapshot_ref","ack_cursor","ack_payload_digest"],"additionalProperties":false};

function validate133(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate133.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.schema_version === undefined) || (!(func0.call(data, "schema_version")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "schema_version"},message:"must have required property '"+"schema_version"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.type === undefined) || (!(func0.call(data, "type")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.binding === undefined) || (!(func0.call(data, "binding")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "binding"},message:"must have required property '"+"binding"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.state === undefined) || (!(func0.call(data, "state")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "state"},message:"must have required property '"+"state"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.snapshot_ref === undefined) || (!(func0.call(data, "snapshot_ref")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot_ref"},message:"must have required property '"+"snapshot_ref"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.ack_cursor === undefined) || (!(func0.call(data, "ack_cursor")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "ack_cursor"},message:"must have required property '"+"ack_cursor"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.ack_payload_digest === undefined) || (!(func0.call(data, "ack_payload_digest")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "ack_payload_digest"},message:"must have required property '"+"ack_payload_digest"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(((((((key0 === "schema_version") || (key0 === "type")) || (key0 === "binding")) || (key0 === "state")) || (key0 === "snapshot_ref")) || (key0 === "ack_cursor")) || (key0 === "ack_payload_digest"))){
const err7 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.schema_version !== undefined && func0.call(data, "schema_version")){
if("event-channel/0.1.0-draft.1" !== data.schema_version){
const err8 = {instancePath:instancePath+"/schema_version",schemaPath:"#/properties/schema_version/const",keyword:"const",params:{allowedValue: "event-channel/0.1.0-draft.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.type !== undefined && func0.call(data, "type")){
if("server.attached" !== data.type){
const err9 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/const",keyword:"const",params:{allowedValue: "server.attached"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.binding !== undefined && func0.call(data, "binding")){
if(!(validate92.call(this, data.binding, {instancePath:instancePath+"/binding",parentData:data,parentDataProperty:"binding",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate92.errors : vErrors.concat(validate92.errors);
errors = vErrors.length;
}
}
if(data.state !== undefined && func0.call(data, "state")){
let data3 = data.state;
if(!(((data3 === "building") || (data3 === "snapshot_ready")) || (data3 === "catching_up"))){
const err10 = {instancePath:instancePath+"/state",schemaPath:"#/properties/state/enum",keyword:"enum",params:{allowedValues: schema42.properties.state.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.snapshot_ref !== undefined && func0.call(data, "snapshot_ref")){
let data4 = data.snapshot_ref;
const _errs7 = errors;
let valid1 = false;
const _errs8 = errors;
if(!(validate105.call(this, data4, {instancePath:instancePath+"/snapshot_ref",parentData:data,parentDataProperty:"snapshot_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate105.errors : vErrors.concat(validate105.errors);
errors = vErrors.length;
}
var _valid0 = _errs8 === errors;
valid1 = valid1 || _valid0;
const _errs9 = errors;
if(data4 !== null){
const err11 = {instancePath:instancePath+"/snapshot_ref",schemaPath:"#/properties/snapshot_ref/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
var _valid0 = _errs9 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err12 = {instancePath:instancePath+"/snapshot_ref",schemaPath:"#/properties/snapshot_ref/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
else {
errors = _errs7;
if(vErrors !== null){
if(_errs7){
vErrors.length = _errs7;
}
else {
vErrors = null;
}
}
}
}
if(data.ack_cursor !== undefined && func0.call(data, "ack_cursor")){
if(!(validate80.call(this, data.ack_cursor, {instancePath:instancePath+"/ack_cursor",parentData:data,parentDataProperty:"ack_cursor",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate80.errors : vErrors.concat(validate80.errors);
errors = vErrors.length;
}
}
if(data.ack_payload_digest !== undefined && func0.call(data, "ack_payload_digest")){
if(!(validate78.call(this, data.ack_payload_digest, {instancePath:instancePath+"/ack_payload_digest",parentData:data,parentDataProperty:"ack_payload_digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate78.errors : vErrors.concat(validate78.errors);
errors = vErrors.length;
}
}
}
else {
const err13 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
validate133.errors = vErrors;
return errors === 0;
}
validate133.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema43 = {"type":"object","properties":{"schema_version":{"const":"event-channel/0.1.0-draft.1"},"type":{"const":"server.sync.ready"},"binding":{"$ref":"#/$defs/channel__DeliveryBinding"},"baseline_snapshot_id":{"$ref":"#/$defs/channel__Id"},"cursor":{"$ref":"#/$defs/channel__Counter"},"previous_cursor":{"$ref":"#/$defs/channel__Counter"},"payload_digest":{"$ref":"#/$defs/channel__Digest"},"delivery_mode":{"const":"reconcile"}},"required":["schema_version","type","binding","baseline_snapshot_id","cursor","previous_cursor","payload_digest","delivery_mode"],"additionalProperties":false};

function validate139(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate139.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.schema_version === undefined) || (!(func0.call(data, "schema_version")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "schema_version"},message:"must have required property '"+"schema_version"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.type === undefined) || (!(func0.call(data, "type")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.binding === undefined) || (!(func0.call(data, "binding")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "binding"},message:"must have required property '"+"binding"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.baseline_snapshot_id === undefined) || (!(func0.call(data, "baseline_snapshot_id")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "baseline_snapshot_id"},message:"must have required property '"+"baseline_snapshot_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.cursor === undefined) || (!(func0.call(data, "cursor")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "cursor"},message:"must have required property '"+"cursor"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.previous_cursor === undefined) || (!(func0.call(data, "previous_cursor")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "previous_cursor"},message:"must have required property '"+"previous_cursor"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.payload_digest === undefined) || (!(func0.call(data, "payload_digest")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "payload_digest"},message:"must have required property '"+"payload_digest"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if((data.delivery_mode === undefined) || (!(func0.call(data, "delivery_mode")))){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "delivery_mode"},message:"must have required property '"+"delivery_mode"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((((((((key0 === "schema_version") || (key0 === "type")) || (key0 === "binding")) || (key0 === "baseline_snapshot_id")) || (key0 === "cursor")) || (key0 === "previous_cursor")) || (key0 === "payload_digest")) || (key0 === "delivery_mode"))){
const err8 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.schema_version !== undefined && func0.call(data, "schema_version")){
if("event-channel/0.1.0-draft.1" !== data.schema_version){
const err9 = {instancePath:instancePath+"/schema_version",schemaPath:"#/properties/schema_version/const",keyword:"const",params:{allowedValue: "event-channel/0.1.0-draft.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.type !== undefined && func0.call(data, "type")){
if("server.sync.ready" !== data.type){
const err10 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/const",keyword:"const",params:{allowedValue: "server.sync.ready"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.binding !== undefined && func0.call(data, "binding")){
if(!(validate92.call(this, data.binding, {instancePath:instancePath+"/binding",parentData:data,parentDataProperty:"binding",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate92.errors : vErrors.concat(validate92.errors);
errors = vErrors.length;
}
}
if(data.baseline_snapshot_id !== undefined && func0.call(data, "baseline_snapshot_id")){
if(!(validate56.call(this, data.baseline_snapshot_id, {instancePath:instancePath+"/baseline_snapshot_id",parentData:data,parentDataProperty:"baseline_snapshot_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
errors = vErrors.length;
}
}
if(data.cursor !== undefined && func0.call(data, "cursor")){
if(!(validate80.call(this, data.cursor, {instancePath:instancePath+"/cursor",parentData:data,parentDataProperty:"cursor",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate80.errors : vErrors.concat(validate80.errors);
errors = vErrors.length;
}
}
if(data.previous_cursor !== undefined && func0.call(data, "previous_cursor")){
if(!(validate80.call(this, data.previous_cursor, {instancePath:instancePath+"/previous_cursor",parentData:data,parentDataProperty:"previous_cursor",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate80.errors : vErrors.concat(validate80.errors);
errors = vErrors.length;
}
}
if(data.payload_digest !== undefined && func0.call(data, "payload_digest")){
if(!(validate78.call(this, data.payload_digest, {instancePath:instancePath+"/payload_digest",parentData:data,parentDataProperty:"payload_digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate78.errors : vErrors.concat(validate78.errors);
errors = vErrors.length;
}
}
if(data.delivery_mode !== undefined && func0.call(data, "delivery_mode")){
if("reconcile" !== data.delivery_mode){
const err11 = {instancePath:instancePath+"/delivery_mode",schemaPath:"#/properties/delivery_mode/const",keyword:"const",params:{allowedValue: "reconcile"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
else {
const err12 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
validate139.errors = vErrors;
return errors === 0;
}
validate139.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema44 = {"type":"object","properties":{"schema_version":{"const":"event-channel/0.1.0-draft.1"},"type":{"const":"server.resync.required"},"binding":{"$ref":"#/$defs/channel__DeliveryBinding"},"reason_code":{"enum":["authorization_changed","stream_changed","retention_lost","projection_lost","capacity_exceeded","snapshot_invalid","binding_mismatch"]},"last_confirmed_cursor":{"$ref":"#/$defs/channel__Counter"}},"required":["schema_version","type","binding","reason_code","last_confirmed_cursor"],"additionalProperties":false};

function validate146(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate146.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.schema_version === undefined) || (!(func0.call(data, "schema_version")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "schema_version"},message:"must have required property '"+"schema_version"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.type === undefined) || (!(func0.call(data, "type")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.binding === undefined) || (!(func0.call(data, "binding")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "binding"},message:"must have required property '"+"binding"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.reason_code === undefined) || (!(func0.call(data, "reason_code")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reason_code"},message:"must have required property '"+"reason_code"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.last_confirmed_cursor === undefined) || (!(func0.call(data, "last_confirmed_cursor")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "last_confirmed_cursor"},message:"must have required property '"+"last_confirmed_cursor"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(((((key0 === "schema_version") || (key0 === "type")) || (key0 === "binding")) || (key0 === "reason_code")) || (key0 === "last_confirmed_cursor"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.schema_version !== undefined && func0.call(data, "schema_version")){
if("event-channel/0.1.0-draft.1" !== data.schema_version){
const err6 = {instancePath:instancePath+"/schema_version",schemaPath:"#/properties/schema_version/const",keyword:"const",params:{allowedValue: "event-channel/0.1.0-draft.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.type !== undefined && func0.call(data, "type")){
if("server.resync.required" !== data.type){
const err7 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/const",keyword:"const",params:{allowedValue: "server.resync.required"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.binding !== undefined && func0.call(data, "binding")){
if(!(validate92.call(this, data.binding, {instancePath:instancePath+"/binding",parentData:data,parentDataProperty:"binding",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate92.errors : vErrors.concat(validate92.errors);
errors = vErrors.length;
}
}
if(data.reason_code !== undefined && func0.call(data, "reason_code")){
let data3 = data.reason_code;
if(!(((((((data3 === "authorization_changed") || (data3 === "stream_changed")) || (data3 === "retention_lost")) || (data3 === "projection_lost")) || (data3 === "capacity_exceeded")) || (data3 === "snapshot_invalid")) || (data3 === "binding_mismatch"))){
const err8 = {instancePath:instancePath+"/reason_code",schemaPath:"#/properties/reason_code/enum",keyword:"enum",params:{allowedValues: schema44.properties.reason_code.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.last_confirmed_cursor !== undefined && func0.call(data, "last_confirmed_cursor")){
if(!(validate80.call(this, data.last_confirmed_cursor, {instancePath:instancePath+"/last_confirmed_cursor",parentData:data,parentDataProperty:"last_confirmed_cursor",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate80.errors : vErrors.concat(validate80.errors);
errors = vErrors.length;
}
}
}
else {
const err9 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
validate146.errors = vErrors;
return errors === 0;
}
validate146.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema45 = {"type":"object","properties":{"format_version":{"const":"snapshot-projection/0.2.0-draft.1"},"type":{"const":"server.data"},"binding":{"$ref":"#/$defs/snapshot__DeliveryBinding"},"cursor":{"$ref":"#/$defs/snapshot__Counter"},"previous_cursor":{"$ref":"#/$defs/snapshot__Counter"},"delivery_mode":{"enum":["live","reconcile"]},"entry":{"$ref":"#/$defs/snapshot__DeltaPayload"},"payload_digest":{"$ref":"#/$defs/snapshot__Digest"}},"required":["format_version","type","binding","cursor","previous_cursor","delivery_mode","entry","payload_digest"],"additionalProperties":false};

function validate151(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate151.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.subscription_id === undefined) || (!(func0.call(data, "subscription_id")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "subscription_id"},message:"must have required property '"+"subscription_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.publisher_service_id === undefined) || (!(func0.call(data, "publisher_service_id")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publisher_service_id"},message:"must have required property '"+"publisher_service_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.publisher_database_instance_id === undefined) || (!(func0.call(data, "publisher_database_instance_id")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publisher_database_instance_id"},message:"must have required property '"+"publisher_database_instance_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.stream_id === undefined) || (!(func0.call(data, "stream_id")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stream_id"},message:"must have required property '"+"stream_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.stream_epoch === undefined) || (!(func0.call(data, "stream_epoch")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stream_epoch"},message:"must have required property '"+"stream_epoch"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.scope_digest === undefined) || (!(func0.call(data, "scope_digest")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope_digest"},message:"must have required property '"+"scope_digest"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.authorization_revision === undefined) || (!(func0.call(data, "authorization_revision")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "authorization_revision"},message:"must have required property '"+"authorization_revision"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if((data.connection_generation === undefined) || (!(func0.call(data, "connection_generation")))){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "connection_generation"},message:"must have required property '"+"connection_generation"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((((((((key0 === "subscription_id") || (key0 === "publisher_service_id")) || (key0 === "publisher_database_instance_id")) || (key0 === "stream_id")) || (key0 === "stream_epoch")) || (key0 === "scope_digest")) || (key0 === "authorization_revision")) || (key0 === "connection_generation"))){
const err8 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.subscription_id !== undefined && func0.call(data, "subscription_id")){
if(!(validate93.call(this, data.subscription_id, {instancePath:instancePath+"/subscription_id",parentData:data,parentDataProperty:"subscription_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.publisher_service_id !== undefined && func0.call(data, "publisher_service_id")){
if(!(validate93.call(this, data.publisher_service_id, {instancePath:instancePath+"/publisher_service_id",parentData:data,parentDataProperty:"publisher_service_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.publisher_database_instance_id !== undefined && func0.call(data, "publisher_database_instance_id")){
if(!(validate93.call(this, data.publisher_database_instance_id, {instancePath:instancePath+"/publisher_database_instance_id",parentData:data,parentDataProperty:"publisher_database_instance_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.stream_id !== undefined && func0.call(data, "stream_id")){
if(!(validate93.call(this, data.stream_id, {instancePath:instancePath+"/stream_id",parentData:data,parentDataProperty:"stream_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.stream_epoch !== undefined && func0.call(data, "stream_epoch")){
if(!(validate93.call(this, data.stream_epoch, {instancePath:instancePath+"/stream_epoch",parentData:data,parentDataProperty:"stream_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.scope_digest !== undefined && func0.call(data, "scope_digest")){
if(!(validate99.call(this, data.scope_digest, {instancePath:instancePath+"/scope_digest",parentData:data,parentDataProperty:"scope_digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate99.errors : vErrors.concat(validate99.errors);
errors = vErrors.length;
}
}
if(data.authorization_revision !== undefined && func0.call(data, "authorization_revision")){
if(!(validate101.call(this, data.authorization_revision, {instancePath:instancePath+"/authorization_revision",parentData:data,parentDataProperty:"authorization_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.connection_generation !== undefined && func0.call(data, "connection_generation")){
if(!(validate101.call(this, data.connection_generation, {instancePath:instancePath+"/connection_generation",parentData:data,parentDataProperty:"connection_generation",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
}
else {
const err9 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
validate151.errors = vErrors;
return errors === 0;
}
validate151.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema47 = {"oneOf":[{"type":"object","properties":{"entry_kind":{"const":"entity.upsert"},"payload":{"$ref":"#/$defs/snapshot__Record"}},"required":["entry_kind","payload"],"additionalProperties":false},{"type":"object","properties":{"entry_kind":{"const":"entity.remove"},"payload":{"type":"object","properties":{"entity_kind":{"$ref":"#/$defs/snapshot__EntityKind"},"entity_id":{"$ref":"#/$defs/snapshot__Id"},"entity_epoch":{"$ref":"#/$defs/snapshot__Id"},"entity_revision":{"$ref":"#/$defs/snapshot__Counter"},"reason":{"enum":["deleted","left_scope"]}},"required":["entity_kind","entity_id","entity_epoch","entity_revision","reason"],"additionalProperties":false}},"required":["entry_kind","payload"],"additionalProperties":false},{"type":"object","properties":{"entry_kind":{"const":"source.event"},"payload":{"$ref":"#/$defs/snapshot__SourceEvent"}},"required":["entry_kind","payload"],"additionalProperties":false}]};
const schema48 = {"oneOf":[{"type":"object","properties":{"entity_kind":{"const":"devices"},"entity_id":{"$ref":"#/$defs/snapshot__Id"},"entity_epoch":{"$ref":"#/$defs/snapshot__Id"},"entity_revision":{"$ref":"#/$defs/snapshot__Counter"},"view":{"$ref":"#/$defs/snapshot__DeviceSnapshotView"}},"required":["entity_kind","entity_id","entity_epoch","entity_revision","view"],"additionalProperties":false},{"type":"object","properties":{"entity_kind":{"const":"catalogs"},"entity_id":{"$ref":"#/$defs/snapshot__Id"},"entity_epoch":{"$ref":"#/$defs/snapshot__Id"},"entity_revision":{"$ref":"#/$defs/snapshot__Counter"},"view":{"$ref":"#/$defs/snapshot__CatalogSnapshotView"}},"required":["entity_kind","entity_id","entity_epoch","entity_revision","view"],"additionalProperties":false},{"type":"object","properties":{"entity_kind":{"const":"commands"},"entity_id":{"$ref":"#/$defs/snapshot__Id"},"entity_epoch":{"$ref":"#/$defs/snapshot__Id"},"entity_revision":{"$ref":"#/$defs/snapshot__Counter"},"view":{"$ref":"#/$defs/snapshot__CommandSnapshotView"}},"required":["entity_kind","entity_id","entity_epoch","entity_revision","view"],"additionalProperties":false},{"type":"object","properties":{"entity_kind":{"const":"controls"},"entity_id":{"$ref":"#/$defs/snapshot__Id"},"entity_epoch":{"$ref":"#/$defs/snapshot__Id"},"entity_revision":{"$ref":"#/$defs/snapshot__Counter"},"view":{"$ref":"#/$defs/snapshot__ControlSnapshotView"}},"required":["entity_kind","entity_id","entity_epoch","entity_revision","view"],"additionalProperties":false},{"type":"object","properties":{"entity_kind":{"const":"observations"},"entity_id":{"$ref":"#/$defs/snapshot__Id"},"entity_epoch":{"$ref":"#/$defs/snapshot__Id"},"entity_revision":{"$ref":"#/$defs/snapshot__Counter"},"view":{"$ref":"#/$defs/snapshot__ObservationSnapshotView"}},"required":["entity_kind","entity_id","entity_epoch","entity_revision","view"],"additionalProperties":false},{"type":"object","properties":{"entity_kind":{"const":"sources"},"entity_id":{"$ref":"#/$defs/snapshot__Id"},"entity_epoch":{"$ref":"#/$defs/snapshot__Id"},"entity_revision":{"$ref":"#/$defs/snapshot__Counter"},"view":{"$ref":"#/$defs/snapshot__SourceSnapshotView"}},"required":["entity_kind","entity_id","entity_epoch","entity_revision","view"],"additionalProperties":false},{"type":"object","properties":{"entity_kind":{"const":"definitions"},"entity_id":{"$ref":"#/$defs/snapshot__Id"},"entity_epoch":{"$ref":"#/$defs/snapshot__Id"},"entity_revision":{"$ref":"#/$defs/snapshot__Counter"},"view":{"$ref":"#/$defs/snapshot__DefinitionSnapshotView"}},"required":["entity_kind","entity_id","entity_epoch","entity_revision","view"],"additionalProperties":false},{"type":"object","properties":{"entity_kind":{"const":"runs"},"entity_id":{"$ref":"#/$defs/snapshot__Id"},"entity_epoch":{"$ref":"#/$defs/snapshot__Id"},"entity_revision":{"$ref":"#/$defs/snapshot__Counter"},"view":{"$ref":"#/$defs/snapshot__RunSnapshotView"}},"required":["entity_kind","entity_id","entity_epoch","entity_revision","view"],"additionalProperties":false},{"type":"object","properties":{"entity_kind":{"const":"business_states"},"entity_id":{"$ref":"#/$defs/snapshot__Id"},"entity_epoch":{"$ref":"#/$defs/snapshot__Id"},"entity_revision":{"$ref":"#/$defs/snapshot__Counter"},"view":{"$ref":"#/$defs/snapshot__BusinessStateSnapshotView"}},"required":["entity_kind","entity_id","entity_epoch","entity_revision","view"],"additionalProperties":false},{"type":"object","properties":{"entity_kind":{"const":"executions"},"entity_id":{"$ref":"#/$defs/snapshot__Id"},"entity_epoch":{"$ref":"#/$defs/snapshot__Id"},"entity_revision":{"$ref":"#/$defs/snapshot__Counter"},"view":{"$ref":"#/$defs/snapshot__ExecutionSnapshotView"}},"required":["entity_kind","entity_id","entity_epoch","entity_revision","view"],"additionalProperties":false},{"type":"object","properties":{"entity_kind":{"const":"schedule_activations"},"entity_id":{"$ref":"#/$defs/snapshot__Id"},"entity_epoch":{"$ref":"#/$defs/snapshot__Id"},"entity_revision":{"$ref":"#/$defs/snapshot__Counter"},"view":{"$ref":"#/$defs/snapshot__ScheduleActivationSnapshotView"}},"required":["entity_kind","entity_id","entity_epoch","entity_revision","view"],"additionalProperties":false},{"type":"object","properties":{"entity_kind":{"const":"occurrences"},"entity_id":{"$ref":"#/$defs/snapshot__Id"},"entity_epoch":{"$ref":"#/$defs/snapshot__Id"},"entity_revision":{"$ref":"#/$defs/snapshot__Counter"},"view":{"$ref":"#/$defs/snapshot__OccurrenceSnapshotView"}},"required":["entity_kind","entity_id","entity_epoch","entity_revision","view"],"additionalProperties":false}]};
const schema49 = {"type":"object","properties":{"device_kind":{"$ref":"#/$defs/snapshot__Id"},"display_name":{"type":"string","maxLength":1024},"model":{"anyOf":[{"type":"string","maxLength":1024},{"type":"null"}]},"firmware":{"anyOf":[{"type":"string","maxLength":1024},{"type":"null"}]},"connection_state":{"enum":["disconnected","connecting","ready","faulted"]},"observation_quality":{"enum":["fresh","stale","unavailable"]},"catalog_ref":{"anyOf":[{"$ref":"#/$defs/snapshot__ObjectRef"},{"type":"null"}]}},"required":["device_kind","display_name","model","firmware","connection_state","observation_quality","catalog_ref"],"additionalProperties":false};
const schema50 = {"type":"object","properties":{"authority_service_id":{"$ref":"#/$defs/snapshot__Id"},"database_instance_id":{"$ref":"#/$defs/snapshot__Id"},"entity_kind":{"$ref":"#/$defs/snapshot__Id"},"entity_id":{"$ref":"#/$defs/snapshot__Id"},"entity_epoch":{"$ref":"#/$defs/snapshot__Id"},"revision":{"$ref":"#/$defs/snapshot__Counter"},"content_digest":{"$ref":"#/$defs/snapshot__Digest"}},"required":["authority_service_id","database_instance_id","entity_kind","entity_id","entity_epoch","revision","content_digest"],"additionalProperties":false};

function validate170(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate170.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.authority_service_id === undefined) || (!(func0.call(data, "authority_service_id")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "authority_service_id"},message:"must have required property '"+"authority_service_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.database_instance_id === undefined) || (!(func0.call(data, "database_instance_id")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "database_instance_id"},message:"must have required property '"+"database_instance_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.entity_kind === undefined) || (!(func0.call(data, "entity_kind")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "entity_kind"},message:"must have required property '"+"entity_kind"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.entity_id === undefined) || (!(func0.call(data, "entity_id")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "entity_id"},message:"must have required property '"+"entity_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.entity_epoch === undefined) || (!(func0.call(data, "entity_epoch")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "entity_epoch"},message:"must have required property '"+"entity_epoch"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.revision === undefined) || (!(func0.call(data, "revision")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "revision"},message:"must have required property '"+"revision"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.content_digest === undefined) || (!(func0.call(data, "content_digest")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "content_digest"},message:"must have required property '"+"content_digest"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(((((((key0 === "authority_service_id") || (key0 === "database_instance_id")) || (key0 === "entity_kind")) || (key0 === "entity_id")) || (key0 === "entity_epoch")) || (key0 === "revision")) || (key0 === "content_digest"))){
const err7 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.authority_service_id !== undefined && func0.call(data, "authority_service_id")){
if(!(validate93.call(this, data.authority_service_id, {instancePath:instancePath+"/authority_service_id",parentData:data,parentDataProperty:"authority_service_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.database_instance_id !== undefined && func0.call(data, "database_instance_id")){
if(!(validate93.call(this, data.database_instance_id, {instancePath:instancePath+"/database_instance_id",parentData:data,parentDataProperty:"database_instance_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_kind !== undefined && func0.call(data, "entity_kind")){
if(!(validate93.call(this, data.entity_kind, {instancePath:instancePath+"/entity_kind",parentData:data,parentDataProperty:"entity_kind",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_id !== undefined && func0.call(data, "entity_id")){
if(!(validate93.call(this, data.entity_id, {instancePath:instancePath+"/entity_id",parentData:data,parentDataProperty:"entity_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_epoch !== undefined && func0.call(data, "entity_epoch")){
if(!(validate93.call(this, data.entity_epoch, {instancePath:instancePath+"/entity_epoch",parentData:data,parentDataProperty:"entity_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.revision !== undefined && func0.call(data, "revision")){
if(!(validate101.call(this, data.revision, {instancePath:instancePath+"/revision",parentData:data,parentDataProperty:"revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.content_digest !== undefined && func0.call(data, "content_digest")){
if(!(validate99.call(this, data.content_digest, {instancePath:instancePath+"/content_digest",parentData:data,parentDataProperty:"content_digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate99.errors : vErrors.concat(validate99.errors);
errors = vErrors.length;
}
}
}
else {
const err8 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
validate170.errors = vErrors;
return errors === 0;
}
validate170.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate168(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate168.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.device_kind === undefined) || (!(func0.call(data, "device_kind")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "device_kind"},message:"must have required property '"+"device_kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.display_name === undefined) || (!(func0.call(data, "display_name")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "display_name"},message:"must have required property '"+"display_name"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.model === undefined) || (!(func0.call(data, "model")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "model"},message:"must have required property '"+"model"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.firmware === undefined) || (!(func0.call(data, "firmware")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "firmware"},message:"must have required property '"+"firmware"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.connection_state === undefined) || (!(func0.call(data, "connection_state")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "connection_state"},message:"must have required property '"+"connection_state"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.observation_quality === undefined) || (!(func0.call(data, "observation_quality")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "observation_quality"},message:"must have required property '"+"observation_quality"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.catalog_ref === undefined) || (!(func0.call(data, "catalog_ref")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog_ref"},message:"must have required property '"+"catalog_ref"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(((((((key0 === "device_kind") || (key0 === "display_name")) || (key0 === "model")) || (key0 === "firmware")) || (key0 === "connection_state")) || (key0 === "observation_quality")) || (key0 === "catalog_ref"))){
const err7 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.device_kind !== undefined && func0.call(data, "device_kind")){
if(!(validate93.call(this, data.device_kind, {instancePath:instancePath+"/device_kind",parentData:data,parentDataProperty:"device_kind",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.display_name !== undefined && func0.call(data, "display_name")){
let data1 = data.display_name;
if(typeof data1 === "string"){
if(func64(data1) > 1024){
const err8 = {instancePath:instancePath+"/display_name",schemaPath:"#/properties/display_name/maxLength",keyword:"maxLength",params:{limit: 1024},message:"must NOT have more than 1024 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
else {
const err9 = {instancePath:instancePath+"/display_name",schemaPath:"#/properties/display_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.model !== undefined && func0.call(data, "model")){
let data2 = data.model;
const _errs6 = errors;
let valid1 = false;
const _errs7 = errors;
if(typeof data2 === "string"){
if(func64(data2) > 1024){
const err10 = {instancePath:instancePath+"/model",schemaPath:"#/properties/model/anyOf/0/maxLength",keyword:"maxLength",params:{limit: 1024},message:"must NOT have more than 1024 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
else {
const err11 = {instancePath:instancePath+"/model",schemaPath:"#/properties/model/anyOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
var _valid0 = _errs7 === errors;
valid1 = valid1 || _valid0;
const _errs9 = errors;
if(data2 !== null){
const err12 = {instancePath:instancePath+"/model",schemaPath:"#/properties/model/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
var _valid0 = _errs9 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err13 = {instancePath:instancePath+"/model",schemaPath:"#/properties/model/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
else {
errors = _errs6;
if(vErrors !== null){
if(_errs6){
vErrors.length = _errs6;
}
else {
vErrors = null;
}
}
}
}
if(data.firmware !== undefined && func0.call(data, "firmware")){
let data3 = data.firmware;
const _errs12 = errors;
let valid2 = false;
const _errs13 = errors;
if(typeof data3 === "string"){
if(func64(data3) > 1024){
const err14 = {instancePath:instancePath+"/firmware",schemaPath:"#/properties/firmware/anyOf/0/maxLength",keyword:"maxLength",params:{limit: 1024},message:"must NOT have more than 1024 characters"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
else {
const err15 = {instancePath:instancePath+"/firmware",schemaPath:"#/properties/firmware/anyOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
var _valid1 = _errs13 === errors;
valid2 = valid2 || _valid1;
const _errs15 = errors;
if(data3 !== null){
const err16 = {instancePath:instancePath+"/firmware",schemaPath:"#/properties/firmware/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
var _valid1 = _errs15 === errors;
valid2 = valid2 || _valid1;
if(!valid2){
const err17 = {instancePath:instancePath+"/firmware",schemaPath:"#/properties/firmware/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
else {
errors = _errs12;
if(vErrors !== null){
if(_errs12){
vErrors.length = _errs12;
}
else {
vErrors = null;
}
}
}
}
if(data.connection_state !== undefined && func0.call(data, "connection_state")){
let data4 = data.connection_state;
if(!((((data4 === "disconnected") || (data4 === "connecting")) || (data4 === "ready")) || (data4 === "faulted"))){
const err18 = {instancePath:instancePath+"/connection_state",schemaPath:"#/properties/connection_state/enum",keyword:"enum",params:{allowedValues: schema49.properties.connection_state.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.observation_quality !== undefined && func0.call(data, "observation_quality")){
let data5 = data.observation_quality;
if(!(((data5 === "fresh") || (data5 === "stale")) || (data5 === "unavailable"))){
const err19 = {instancePath:instancePath+"/observation_quality",schemaPath:"#/properties/observation_quality/enum",keyword:"enum",params:{allowedValues: schema49.properties.observation_quality.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.catalog_ref !== undefined && func0.call(data, "catalog_ref")){
let data6 = data.catalog_ref;
const _errs20 = errors;
let valid3 = false;
const _errs21 = errors;
if(!(validate170.call(this, data6, {instancePath:instancePath+"/catalog_ref",parentData:data,parentDataProperty:"catalog_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
var _valid2 = _errs21 === errors;
valid3 = valid3 || _valid2;
const _errs22 = errors;
if(data6 !== null){
const err20 = {instancePath:instancePath+"/catalog_ref",schemaPath:"#/properties/catalog_ref/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
var _valid2 = _errs22 === errors;
valid3 = valid3 || _valid2;
if(!valid3){
const err21 = {instancePath:instancePath+"/catalog_ref",schemaPath:"#/properties/catalog_ref/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
else {
errors = _errs20;
if(vErrors !== null){
if(_errs20){
vErrors.length = _errs20;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err22 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
validate168.errors = vErrors;
return errors === 0;
}
validate168.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema51 = {"type":"object","properties":{"device_ref":{"$ref":"#/$defs/snapshot__ObjectRef"},"approval_state":{"enum":["approved","unavailable","revoked"]},"capability_revision":{"$ref":"#/$defs/snapshot__Counter"},"capability_digest":{"$ref":"#/$defs/snapshot__Digest"},"action_ids":{"type":"array","items":{"$ref":"#/$defs/snapshot__Id"},"maxItems":256},"trigger_ids":{"type":"array","items":{"$ref":"#/$defs/snapshot__Id"},"maxItems":256},"catalog_ref":{"anyOf":[{"$ref":"#/$defs/snapshot__ObjectRef"},{"type":"null"}]},"unavailable_reason":{"anyOf":[{"$ref":"#/$defs/snapshot__Id"},{"type":"null"}]}},"required":["device_ref","approval_state","capability_revision","capability_digest","action_ids","trigger_ids","catalog_ref","unavailable_reason"],"additionalProperties":false};

function validate183(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate183.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.device_ref === undefined) || (!(func0.call(data, "device_ref")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "device_ref"},message:"must have required property '"+"device_ref"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.approval_state === undefined) || (!(func0.call(data, "approval_state")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "approval_state"},message:"must have required property '"+"approval_state"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.capability_revision === undefined) || (!(func0.call(data, "capability_revision")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "capability_revision"},message:"must have required property '"+"capability_revision"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.capability_digest === undefined) || (!(func0.call(data, "capability_digest")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "capability_digest"},message:"must have required property '"+"capability_digest"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.action_ids === undefined) || (!(func0.call(data, "action_ids")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "action_ids"},message:"must have required property '"+"action_ids"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.trigger_ids === undefined) || (!(func0.call(data, "trigger_ids")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "trigger_ids"},message:"must have required property '"+"trigger_ids"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.catalog_ref === undefined) || (!(func0.call(data, "catalog_ref")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "catalog_ref"},message:"must have required property '"+"catalog_ref"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if((data.unavailable_reason === undefined) || (!(func0.call(data, "unavailable_reason")))){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "unavailable_reason"},message:"must have required property '"+"unavailable_reason"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((((((((key0 === "device_ref") || (key0 === "approval_state")) || (key0 === "capability_revision")) || (key0 === "capability_digest")) || (key0 === "action_ids")) || (key0 === "trigger_ids")) || (key0 === "catalog_ref")) || (key0 === "unavailable_reason"))){
const err8 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.device_ref !== undefined && func0.call(data, "device_ref")){
if(!(validate170.call(this, data.device_ref, {instancePath:instancePath+"/device_ref",parentData:data,parentDataProperty:"device_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
if(data.approval_state !== undefined && func0.call(data, "approval_state")){
let data1 = data.approval_state;
if(!(((data1 === "approved") || (data1 === "unavailable")) || (data1 === "revoked"))){
const err9 = {instancePath:instancePath+"/approval_state",schemaPath:"#/properties/approval_state/enum",keyword:"enum",params:{allowedValues: schema51.properties.approval_state.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.capability_revision !== undefined && func0.call(data, "capability_revision")){
if(!(validate101.call(this, data.capability_revision, {instancePath:instancePath+"/capability_revision",parentData:data,parentDataProperty:"capability_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.capability_digest !== undefined && func0.call(data, "capability_digest")){
if(!(validate99.call(this, data.capability_digest, {instancePath:instancePath+"/capability_digest",parentData:data,parentDataProperty:"capability_digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate99.errors : vErrors.concat(validate99.errors);
errors = vErrors.length;
}
}
if(data.action_ids !== undefined && func0.call(data, "action_ids")){
let data4 = data.action_ids;
if(Array.isArray(data4)){
if(data4.length > 256){
const err10 = {instancePath:instancePath+"/action_ids",schemaPath:"#/properties/action_ids/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
const len0 = data4.length;
for(let i0=0; i0<len0; i0++){
if(!(validate93.call(this, data4[i0], {instancePath:instancePath+"/action_ids/" + i0,parentData:data4,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
}
else {
const err11 = {instancePath:instancePath+"/action_ids",schemaPath:"#/properties/action_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.trigger_ids !== undefined && func0.call(data, "trigger_ids")){
let data6 = data.trigger_ids;
if(Array.isArray(data6)){
if(data6.length > 256){
const err12 = {instancePath:instancePath+"/trigger_ids",schemaPath:"#/properties/trigger_ids/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
const len1 = data6.length;
for(let i1=0; i1<len1; i1++){
if(!(validate93.call(this, data6[i1], {instancePath:instancePath+"/trigger_ids/" + i1,parentData:data6,parentDataProperty:i1,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
}
else {
const err13 = {instancePath:instancePath+"/trigger_ids",schemaPath:"#/properties/trigger_ids/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.catalog_ref !== undefined && func0.call(data, "catalog_ref")){
let data8 = data.catalog_ref;
const _errs13 = errors;
let valid5 = false;
const _errs14 = errors;
if(!(validate170.call(this, data8, {instancePath:instancePath+"/catalog_ref",parentData:data,parentDataProperty:"catalog_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
var _valid0 = _errs14 === errors;
valid5 = valid5 || _valid0;
const _errs15 = errors;
if(data8 !== null){
const err14 = {instancePath:instancePath+"/catalog_ref",schemaPath:"#/properties/catalog_ref/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
var _valid0 = _errs15 === errors;
valid5 = valid5 || _valid0;
if(!valid5){
const err15 = {instancePath:instancePath+"/catalog_ref",schemaPath:"#/properties/catalog_ref/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
else {
errors = _errs13;
if(vErrors !== null){
if(_errs13){
vErrors.length = _errs13;
}
else {
vErrors = null;
}
}
}
}
if(data.unavailable_reason !== undefined && func0.call(data, "unavailable_reason")){
let data9 = data.unavailable_reason;
const _errs18 = errors;
let valid6 = false;
const _errs19 = errors;
if(!(validate93.call(this, data9, {instancePath:instancePath+"/unavailable_reason",parentData:data,parentDataProperty:"unavailable_reason",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
var _valid1 = _errs19 === errors;
valid6 = valid6 || _valid1;
const _errs20 = errors;
if(data9 !== null){
const err16 = {instancePath:instancePath+"/unavailable_reason",schemaPath:"#/properties/unavailable_reason/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
var _valid1 = _errs20 === errors;
valid6 = valid6 || _valid1;
if(!valid6){
const err17 = {instancePath:instancePath+"/unavailable_reason",schemaPath:"#/properties/unavailable_reason/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
else {
errors = _errs18;
if(vErrors !== null){
if(_errs18){
vErrors.length = _errs18;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err18 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
validate183.errors = vErrors;
return errors === 0;
}
validate183.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema52 = {"type":"object","properties":{"initial_command_ref":{"$ref":"#/$defs/command__V__S0_InitialCommandRef"},"request_identity":{"$ref":"#/$defs/command__V__S0_RequestIdentity"},"target":{"type":"object","properties":{"device_id":{"$ref":"#/$defs/command__V__S0_Id"},"action_id":{"$ref":"#/$defs/command__V__S0_Id"},"capability_version":{"$ref":"#/$defs/command__V__S0_Version"}},"required":["device_id","action_id","capability_version"],"additionalProperties":false},"origin":{"enum":["manual","automation"]},"accepted_at":{"$ref":"#/$defs/command__V__S0_Timestamp"},"control_binding":{"$ref":"#/$defs/command__V__S0_ControlVersion"},"state_ref":{"$ref":"#/$defs/command__V__S0_Ref"},"cancellation":{"anyOf":[{"$ref":"#/$defs/command__V__S0_CancellationView"},{"type":"null"}]},"source_record_ref":{"type":"object","properties":{"kind":{"const":"command"},"scope":{"$ref":"#/$defs/command__V__S0_Scope"},"object_id":{"$ref":"#/$defs/command__V__S0_Id"},"revision":{"$ref":"#/$defs/command__V__S0_PositiveCounter"},"digest":{"$ref":"#/$defs/command__V__S0_Digest"}},"required":["kind","scope","object_id","revision","digest"],"additionalProperties":false},"state":{"$ref":"#/$defs/snapshot__CommandState"},"completion":{"type":"object","properties":{"required":{"$ref":"#/$defs/command__V__S0_CompletionLevel"},"achieved":{"anyOf":[{"$ref":"#/$defs/command__V__S0_CompletionLevel"},{"type":"null"}]},"policy_ref":{"$ref":"#/$defs/command__V__S0_Ref"},"evidence_count":{"type":"integer","minimum":0,"maximum":256,"xRawInteger":true}},"required":["required","achieved","policy_ref","evidence_count"],"additionalProperties":false}},"required":["initial_command_ref","request_identity","target","origin","accepted_at","control_binding","state_ref","cancellation","source_record_ref","state","completion"],"additionalProperties":false};
const schema53 = {"type":"object","properties":{"kind":{"const":"command"},"scope":{"$ref":"#/$defs/command__V__S2_Scope"},"object_id":{"$ref":"#/$defs/command__V__S2_Id"},"revision":{"$ref":"#/$defs/command__V__S2_Counter"},"digest":{"$ref":"#/$defs/command__V__S2_Digest"}},"required":["kind","scope","object_id","revision","digest"],"additionalProperties":false};
const schema54 = {"type":"object","properties":{"authority_service_id":{"type":"string","minLength":1,"maxLength":128,"pattern":"^[A-Za-z0-9_.:-]+(?![\\s\\S])"},"database_instance_id":{"type":"string","minLength":1,"maxLength":128,"pattern":"^[A-Za-z0-9_.:-]+(?![\\s\\S])"}},"required":["authority_service_id","database_instance_id"],"additionalProperties":false};
const pattern11 = new RegExp("^[A-Za-z0-9_.:-]+(?![\\s\\S])", "u");

function validate197(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate197.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.authority_service_id === undefined) || (!(func0.call(data, "authority_service_id")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "authority_service_id"},message:"must have required property '"+"authority_service_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.database_instance_id === undefined) || (!(func0.call(data, "database_instance_id")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "database_instance_id"},message:"must have required property '"+"database_instance_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((key0 === "authority_service_id") || (key0 === "database_instance_id"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.authority_service_id !== undefined && func0.call(data, "authority_service_id")){
let data0 = data.authority_service_id;
if(typeof data0 === "string"){
if(func64(data0) > 128){
const err3 = {instancePath:instancePath+"/authority_service_id",schemaPath:"#/properties/authority_service_id/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(func64(data0) < 1){
const err4 = {instancePath:instancePath+"/authority_service_id",schemaPath:"#/properties/authority_service_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(!pattern11.test(data0)){
const err5 = {instancePath:instancePath+"/authority_service_id",schemaPath:"#/properties/authority_service_id/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_.:-]+(?![\\s\\S])"},message:"must match pattern \""+"^[A-Za-z0-9_.:-]+(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
else {
const err6 = {instancePath:instancePath+"/authority_service_id",schemaPath:"#/properties/authority_service_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.database_instance_id !== undefined && func0.call(data, "database_instance_id")){
let data1 = data.database_instance_id;
if(typeof data1 === "string"){
if(func64(data1) > 128){
const err7 = {instancePath:instancePath+"/database_instance_id",schemaPath:"#/properties/database_instance_id/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(func64(data1) < 1){
const err8 = {instancePath:instancePath+"/database_instance_id",schemaPath:"#/properties/database_instance_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!pattern11.test(data1)){
const err9 = {instancePath:instancePath+"/database_instance_id",schemaPath:"#/properties/database_instance_id/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_.:-]+(?![\\s\\S])"},message:"must match pattern \""+"^[A-Za-z0-9_.:-]+(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
else {
const err10 = {instancePath:instancePath+"/database_instance_id",schemaPath:"#/properties/database_instance_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
else {
const err11 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
validate197.errors = vErrors;
return errors === 0;
}
validate197.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema55 = {"type":"string","pattern":"^[A-Za-z0-9_-]{1,128}(?![\\s\\S])"};

function validate199(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate199.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(!pattern4.test(data)){
const err0 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]{1,128}(?![\\s\\S])"},message:"must match pattern \""+"^[A-Za-z0-9_-]{1,128}(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate199.errors = vErrors;
return errors === 0;
}
validate199.evaluated = {"dynamicProps":false,"dynamicItems":false};

const schema56 = {"type":"string","pattern":"^(0|[1-9][0-9]{0,19})(?![\\s\\S])"};
const pattern14 = new RegExp("^(0|[1-9][0-9]{0,19})(?![\\s\\S])", "u");

function validate201(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate201.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(!pattern14.test(data)){
const err0 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]{0,19})(?![\\s\\S])"},message:"must match pattern \""+"^(0|[1-9][0-9]{0,19})(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate201.errors = vErrors;
return errors === 0;
}
validate201.evaluated = {"dynamicProps":false,"dynamicItems":false};

const schema57 = {"type":"string","pattern":"^sha256:[0-9a-f]{64}(?![\\s\\S])"};
const pattern15 = new RegExp("^sha256:[0-9a-f]{64}(?![\\s\\S])", "u");

function validate203(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate203.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(!pattern15.test(data)){
const err0 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}(?![\\s\\S])"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate203.errors = vErrors;
return errors === 0;
}
validate203.evaluated = {"dynamicProps":false,"dynamicItems":false};


function validate196(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate196.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.kind === undefined) || (!(func0.call(data, "kind")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.scope === undefined) || (!(func0.call(data, "scope")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope"},message:"must have required property '"+"scope"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.object_id === undefined) || (!(func0.call(data, "object_id")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "object_id"},message:"must have required property '"+"object_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.revision === undefined) || (!(func0.call(data, "revision")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "revision"},message:"must have required property '"+"revision"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.digest === undefined) || (!(func0.call(data, "digest")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "digest"},message:"must have required property '"+"digest"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(((((key0 === "kind") || (key0 === "scope")) || (key0 === "object_id")) || (key0 === "revision")) || (key0 === "digest"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.kind !== undefined && func0.call(data, "kind")){
if("command" !== data.kind){
const err6 = {instancePath:instancePath+"/kind",schemaPath:"#/properties/kind/const",keyword:"const",params:{allowedValue: "command"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.scope !== undefined && func0.call(data, "scope")){
if(!(validate197.call(this, data.scope, {instancePath:instancePath+"/scope",parentData:data,parentDataProperty:"scope",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate197.errors : vErrors.concat(validate197.errors);
errors = vErrors.length;
}
}
if(data.object_id !== undefined && func0.call(data, "object_id")){
if(!(validate199.call(this, data.object_id, {instancePath:instancePath+"/object_id",parentData:data,parentDataProperty:"object_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate199.errors : vErrors.concat(validate199.errors);
errors = vErrors.length;
}
}
if(data.revision !== undefined && func0.call(data, "revision")){
if(!(validate201.call(this, data.revision, {instancePath:instancePath+"/revision",parentData:data,parentDataProperty:"revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate201.errors : vErrors.concat(validate201.errors);
errors = vErrors.length;
}
}
if(data.digest !== undefined && func0.call(data, "digest")){
if(!(validate203.call(this, data.digest, {instancePath:instancePath+"/digest",parentData:data,parentDataProperty:"digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate203.errors : vErrors.concat(validate203.errors);
errors = vErrors.length;
}
}
}
else {
const err7 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
validate196.errors = vErrors;
return errors === 0;
}
validate196.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema58 = {"type":"object","properties":{"key":{"$ref":"#/$defs/command__A__S0_RequestKey"},"request_digest":{"$ref":"#/$defs/command__A__S0_Digest"}},"required":["key","request_digest"],"additionalProperties":false};
const schema59 = {"type":"object","properties":{"target_scope":{"$ref":"#/$defs/command__A__S0_Scope"},"issuer_id":{"$ref":"#/$defs/command__A__S0_Id"},"issuer_epoch":{"$ref":"#/$defs/command__A__S0_Id"},"principal_id":{"$ref":"#/$defs/command__A__S0_Id"},"request_epoch":{"$ref":"#/$defs/command__A__S0_Id"},"operation_id":{"const":"createCommand"},"idempotency_key":{"$ref":"#/$defs/command__A__S0_Id"}},"required":["target_scope","issuer_id","issuer_epoch","principal_id","request_epoch","operation_id","idempotency_key"],"additionalProperties":false};

function validate208(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate208.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.authority_service_id === undefined) || (!(func0.call(data, "authority_service_id")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "authority_service_id"},message:"must have required property '"+"authority_service_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.database_instance_id === undefined) || (!(func0.call(data, "database_instance_id")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "database_instance_id"},message:"must have required property '"+"database_instance_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((key0 === "authority_service_id") || (key0 === "database_instance_id"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.authority_service_id !== undefined && func0.call(data, "authority_service_id")){
let data0 = data.authority_service_id;
if(typeof data0 === "string"){
if(func64(data0) > 128){
const err3 = {instancePath:instancePath+"/authority_service_id",schemaPath:"#/properties/authority_service_id/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(func64(data0) < 1){
const err4 = {instancePath:instancePath+"/authority_service_id",schemaPath:"#/properties/authority_service_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(!pattern11.test(data0)){
const err5 = {instancePath:instancePath+"/authority_service_id",schemaPath:"#/properties/authority_service_id/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_.:-]+(?![\\s\\S])"},message:"must match pattern \""+"^[A-Za-z0-9_.:-]+(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
else {
const err6 = {instancePath:instancePath+"/authority_service_id",schemaPath:"#/properties/authority_service_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.database_instance_id !== undefined && func0.call(data, "database_instance_id")){
let data1 = data.database_instance_id;
if(typeof data1 === "string"){
if(func64(data1) > 128){
const err7 = {instancePath:instancePath+"/database_instance_id",schemaPath:"#/properties/database_instance_id/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(func64(data1) < 1){
const err8 = {instancePath:instancePath+"/database_instance_id",schemaPath:"#/properties/database_instance_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!pattern11.test(data1)){
const err9 = {instancePath:instancePath+"/database_instance_id",schemaPath:"#/properties/database_instance_id/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_.:-]+(?![\\s\\S])"},message:"must match pattern \""+"^[A-Za-z0-9_.:-]+(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
else {
const err10 = {instancePath:instancePath+"/database_instance_id",schemaPath:"#/properties/database_instance_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
else {
const err11 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
validate208.errors = vErrors;
return errors === 0;
}
validate208.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema61 = {"type":"string","pattern":"^[A-Za-z0-9_-]{1,128}(?![\\s\\S])"};

function validate210(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate210.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(!pattern4.test(data)){
const err0 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]{1,128}(?![\\s\\S])"},message:"must match pattern \""+"^[A-Za-z0-9_-]{1,128}(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate210.errors = vErrors;
return errors === 0;
}
validate210.evaluated = {"dynamicProps":false,"dynamicItems":false};


function validate207(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate207.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.target_scope === undefined) || (!(func0.call(data, "target_scope")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "target_scope"},message:"must have required property '"+"target_scope"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.issuer_id === undefined) || (!(func0.call(data, "issuer_id")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "issuer_id"},message:"must have required property '"+"issuer_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.issuer_epoch === undefined) || (!(func0.call(data, "issuer_epoch")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "issuer_epoch"},message:"must have required property '"+"issuer_epoch"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.principal_id === undefined) || (!(func0.call(data, "principal_id")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "principal_id"},message:"must have required property '"+"principal_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.request_epoch === undefined) || (!(func0.call(data, "request_epoch")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "request_epoch"},message:"must have required property '"+"request_epoch"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.operation_id === undefined) || (!(func0.call(data, "operation_id")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "operation_id"},message:"must have required property '"+"operation_id"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.idempotency_key === undefined) || (!(func0.call(data, "idempotency_key")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "idempotency_key"},message:"must have required property '"+"idempotency_key"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(((((((key0 === "target_scope") || (key0 === "issuer_id")) || (key0 === "issuer_epoch")) || (key0 === "principal_id")) || (key0 === "request_epoch")) || (key0 === "operation_id")) || (key0 === "idempotency_key"))){
const err7 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.target_scope !== undefined && func0.call(data, "target_scope")){
if(!(validate208.call(this, data.target_scope, {instancePath:instancePath+"/target_scope",parentData:data,parentDataProperty:"target_scope",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate208.errors : vErrors.concat(validate208.errors);
errors = vErrors.length;
}
}
if(data.issuer_id !== undefined && func0.call(data, "issuer_id")){
if(!(validate210.call(this, data.issuer_id, {instancePath:instancePath+"/issuer_id",parentData:data,parentDataProperty:"issuer_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate210.errors : vErrors.concat(validate210.errors);
errors = vErrors.length;
}
}
if(data.issuer_epoch !== undefined && func0.call(data, "issuer_epoch")){
if(!(validate210.call(this, data.issuer_epoch, {instancePath:instancePath+"/issuer_epoch",parentData:data,parentDataProperty:"issuer_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate210.errors : vErrors.concat(validate210.errors);
errors = vErrors.length;
}
}
if(data.principal_id !== undefined && func0.call(data, "principal_id")){
if(!(validate210.call(this, data.principal_id, {instancePath:instancePath+"/principal_id",parentData:data,parentDataProperty:"principal_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate210.errors : vErrors.concat(validate210.errors);
errors = vErrors.length;
}
}
if(data.request_epoch !== undefined && func0.call(data, "request_epoch")){
if(!(validate210.call(this, data.request_epoch, {instancePath:instancePath+"/request_epoch",parentData:data,parentDataProperty:"request_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate210.errors : vErrors.concat(validate210.errors);
errors = vErrors.length;
}
}
if(data.operation_id !== undefined && func0.call(data, "operation_id")){
if("createCommand" !== data.operation_id){
const err8 = {instancePath:instancePath+"/operation_id",schemaPath:"#/properties/operation_id/const",keyword:"const",params:{allowedValue: "createCommand"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.idempotency_key !== undefined && func0.call(data, "idempotency_key")){
if(!(validate210.call(this, data.idempotency_key, {instancePath:instancePath+"/idempotency_key",parentData:data,parentDataProperty:"idempotency_key",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate210.errors : vErrors.concat(validate210.errors);
errors = vErrors.length;
}
}
}
else {
const err9 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
validate207.errors = vErrors;
return errors === 0;
}
validate207.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema62 = {"type":"string","pattern":"^sha256:[0-9a-f]{64}(?![\\s\\S])"};

function validate217(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate217.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(!pattern15.test(data)){
const err0 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}(?![\\s\\S])"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate217.errors = vErrors;
return errors === 0;
}
validate217.evaluated = {"dynamicProps":false,"dynamicItems":false};


function validate206(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate206.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.key === undefined) || (!(func0.call(data, "key")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "key"},message:"must have required property '"+"key"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.request_digest === undefined) || (!(func0.call(data, "request_digest")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "request_digest"},message:"must have required property '"+"request_digest"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((key0 === "key") || (key0 === "request_digest"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.key !== undefined && func0.call(data, "key")){
if(!(validate207.call(this, data.key, {instancePath:instancePath+"/key",parentData:data,parentDataProperty:"key",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate207.errors : vErrors.concat(validate207.errors);
errors = vErrors.length;
}
}
if(data.request_digest !== undefined && func0.call(data, "request_digest")){
if(!(validate217.call(this, data.request_digest, {instancePath:instancePath+"/request_digest",parentData:data,parentDataProperty:"request_digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate217.errors : vErrors.concat(validate217.errors);
errors = vErrors.length;
}
}
}
else {
const err3 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
validate206.errors = vErrors;
return errors === 0;
}
validate206.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema63 = {"type":"string","minLength":1,"maxLength":256,"pattern":"^[A-Za-z0-9._:/-]+$(?![\\s\\S])"};
const pattern20 = new RegExp("^[A-Za-z0-9._:/-]+$(?![\\s\\S])", "u");

function validate220(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate220.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func64(data) > 256){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(func64(data) < 1){
const err1 = {instancePath,schemaPath:"#/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(!pattern20.test(data)){
const err2 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9._:/-]+$(?![\\s\\S])"},message:"must match pattern \""+"^[A-Za-z0-9._:/-]+$(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
else {
const err3 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
validate220.errors = vErrors;
return errors === 0;
}
validate220.evaluated = {"dynamicProps":false,"dynamicItems":false};

const schema64 = {"type":"string","maxLength":128,"pattern":"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(-[0-9A-Za-z.-]+)?$"};
const pattern21 = new RegExp("^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(-[0-9A-Za-z.-]+)?$", "u");

function validate223(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate223.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func64(data) > 128){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(!pattern21.test(data)){
const err1 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(-[0-9A-Za-z.-]+)?$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(-[0-9A-Za-z.-]+)?$"+"\""};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
else {
const err2 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
validate223.errors = vErrors;
return errors === 0;
}
validate223.evaluated = {"dynamicProps":false,"dynamicItems":false};

const schema65 = {"type":"string","format":"date-time","pattern":"^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$"};
const formats0 = require("ajv-formats/dist/formats").fullFormats["date-time"];
const pattern22 = new RegExp("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$", "u");

function validate225(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate225.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(!pattern22.test(data)){
const err0 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$"},message:"must match pattern \""+"^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$"+"\""};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(!(formats0.validate(data))){
const err1 = {instancePath,schemaPath:"#/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
else {
const err2 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
validate225.errors = vErrors;
return errors === 0;
}
validate225.evaluated = {"dynamicProps":false,"dynamicItems":false};

const schema66 = {"type":"object","properties":{"epoch":{"$ref":"#/$defs/command__V__S5_Id"},"version":{"$ref":"#/$defs/command__V__S5_Revision"}},"required":["epoch","version"],"additionalProperties":false};
const schema67 = {"type":"string","minLength":1,"maxLength":128,"pattern":"^[A-Za-z0-9._-]+$"};
const pattern23 = new RegExp("^[A-Za-z0-9._-]+$", "u");

function validate228(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate228.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func64(data) > 128){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(func64(data) < 1){
const err1 = {instancePath,schemaPath:"#/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(!pattern23.test(data)){
const err2 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9._-]+$"},message:"must match pattern \""+"^[A-Za-z0-9._-]+$"+"\""};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
else {
const err3 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
validate228.errors = vErrors;
return errors === 0;
}
validate228.evaluated = {"dynamicProps":false,"dynamicItems":false};

const schema68 = {"type":"string","maxLength":20,"pattern":"^(0|[1-9][0-9]*)$"};
const pattern24 = new RegExp("^(0|[1-9][0-9]*)$", "u");

function validate230(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate230.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func64(data) > 20){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 20},message:"must NOT have more than 20 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(!pattern24.test(data)){
const err1 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]*)$"},message:"must match pattern \""+"^(0|[1-9][0-9]*)$"+"\""};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
else {
const err2 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
validate230.errors = vErrors;
return errors === 0;
}
validate230.evaluated = {"dynamicProps":false,"dynamicItems":false};


function validate227(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate227.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.epoch === undefined) || (!(func0.call(data, "epoch")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "epoch"},message:"must have required property '"+"epoch"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.version === undefined) || (!(func0.call(data, "version")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "version"},message:"must have required property '"+"version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((key0 === "epoch") || (key0 === "version"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.epoch !== undefined && func0.call(data, "epoch")){
if(!(validate228.call(this, data.epoch, {instancePath:instancePath+"/epoch",parentData:data,parentDataProperty:"epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate228.errors : vErrors.concat(validate228.errors);
errors = vErrors.length;
}
}
if(data.version !== undefined && func0.call(data, "version")){
if(!(validate230.call(this, data.version, {instancePath:instancePath+"/version",parentData:data,parentDataProperty:"version",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate230.errors : vErrors.concat(validate230.errors);
errors = vErrors.length;
}
}
}
else {
const err3 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
validate227.errors = vErrors;
return errors === 0;
}
validate227.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema69 = {"type":"object","properties":{"id":{"$ref":"#/$defs/command__V__S1_Id"},"revision":{"$ref":"#/$defs/command__V__S1_PositiveCounter"},"digest":{"$ref":"#/$defs/command__V__S1_Digest"}},"required":["id","revision","digest"],"additionalProperties":false};

function validate234(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate234.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func64(data) > 256){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(func64(data) < 1){
const err1 = {instancePath,schemaPath:"#/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(!pattern20.test(data)){
const err2 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9._:/-]+$(?![\\s\\S])"},message:"must match pattern \""+"^[A-Za-z0-9._:/-]+$(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
else {
const err3 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
validate234.errors = vErrors;
return errors === 0;
}
validate234.evaluated = {"dynamicProps":false,"dynamicItems":false};

const schema71 = {"type":"string","pattern":"^[1-9][0-9]{0,19}$(?![\\s\\S])"};
const pattern26 = new RegExp("^[1-9][0-9]{0,19}$(?![\\s\\S])", "u");

function validate236(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate236.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(!pattern26.test(data)){
const err0 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^[1-9][0-9]{0,19}$(?![\\s\\S])"},message:"must match pattern \""+"^[1-9][0-9]{0,19}$(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate236.errors = vErrors;
return errors === 0;
}
validate236.evaluated = {"dynamicProps":false,"dynamicItems":false};

const schema72 = {"type":"string","pattern":"^sha256:[0-9a-f]{64}$(?![\\s\\S])"};
const pattern27 = new RegExp("^sha256:[0-9a-f]{64}$(?![\\s\\S])", "u");

function validate238(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate238.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(!pattern27.test(data)){
const err0 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$(?![\\s\\S])"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate238.errors = vErrors;
return errors === 0;
}
validate238.evaluated = {"dynamicProps":false,"dynamicItems":false};


function validate233(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate233.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.id === undefined) || (!(func0.call(data, "id")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.revision === undefined) || (!(func0.call(data, "revision")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "revision"},message:"must have required property '"+"revision"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.digest === undefined) || (!(func0.call(data, "digest")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "digest"},message:"must have required property '"+"digest"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(((key0 === "id") || (key0 === "revision")) || (key0 === "digest"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.id !== undefined && func0.call(data, "id")){
if(!(validate234.call(this, data.id, {instancePath:instancePath+"/id",parentData:data,parentDataProperty:"id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate234.errors : vErrors.concat(validate234.errors);
errors = vErrors.length;
}
}
if(data.revision !== undefined && func0.call(data, "revision")){
if(!(validate236.call(this, data.revision, {instancePath:instancePath+"/revision",parentData:data,parentDataProperty:"revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate236.errors : vErrors.concat(validate236.errors);
errors = vErrors.length;
}
}
if(data.digest !== undefined && func0.call(data, "digest")){
if(!(validate238.call(this, data.digest, {instancePath:instancePath+"/digest",parentData:data,parentDataProperty:"digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate238.errors : vErrors.concat(validate238.errors);
errors = vErrors.length;
}
}
}
else {
const err4 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
validate233.errors = vErrors;
return errors === 0;
}
validate233.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema73 = {"type":"object","properties":{"operation_ref":{"$ref":"#/$defs/command__V__S0_Ref"},"state":{"$ref":"#/$defs/command__V__S0_CancellationState"},"future_writes":{"enum":["pending","closed","indeterminate"]},"reason_code":{"anyOf":[{"$ref":"#/$defs/command__V__S0_Id"},{"type":"null"}]}},"required":["operation_ref","state","future_writes","reason_code"],"additionalProperties":false};
const schema74 = {"enum":["requested","confirmed","unsupported","failed","indeterminate","too_late"]};

function validate243(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate243.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!((((((data === "requested") || (data === "confirmed")) || (data === "unsupported")) || (data === "failed")) || (data === "indeterminate")) || (data === "too_late"))){
const err0 = {instancePath,schemaPath:"#/enum",keyword:"enum",params:{allowedValues: schema74.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
validate243.errors = vErrors;
return errors === 0;
}
validate243.evaluated = {"dynamicProps":false,"dynamicItems":false};


function validate241(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate241.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.operation_ref === undefined) || (!(func0.call(data, "operation_ref")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "operation_ref"},message:"must have required property '"+"operation_ref"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.state === undefined) || (!(func0.call(data, "state")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "state"},message:"must have required property '"+"state"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.future_writes === undefined) || (!(func0.call(data, "future_writes")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "future_writes"},message:"must have required property '"+"future_writes"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.reason_code === undefined) || (!(func0.call(data, "reason_code")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reason_code"},message:"must have required property '"+"reason_code"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((((key0 === "operation_ref") || (key0 === "state")) || (key0 === "future_writes")) || (key0 === "reason_code"))){
const err4 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.operation_ref !== undefined && func0.call(data, "operation_ref")){
if(!(validate233.call(this, data.operation_ref, {instancePath:instancePath+"/operation_ref",parentData:data,parentDataProperty:"operation_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate233.errors : vErrors.concat(validate233.errors);
errors = vErrors.length;
}
}
if(data.state !== undefined && func0.call(data, "state")){
if(!(validate243.call(this, data.state, {instancePath:instancePath+"/state",parentData:data,parentDataProperty:"state",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate243.errors : vErrors.concat(validate243.errors);
errors = vErrors.length;
}
}
if(data.future_writes !== undefined && func0.call(data, "future_writes")){
let data2 = data.future_writes;
if(!(((data2 === "pending") || (data2 === "closed")) || (data2 === "indeterminate"))){
const err5 = {instancePath:instancePath+"/future_writes",schemaPath:"#/properties/future_writes/enum",keyword:"enum",params:{allowedValues: schema73.properties.future_writes.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.reason_code !== undefined && func0.call(data, "reason_code")){
let data3 = data.reason_code;
const _errs6 = errors;
let valid1 = false;
const _errs7 = errors;
if(!(validate220.call(this, data3, {instancePath:instancePath+"/reason_code",parentData:data,parentDataProperty:"reason_code",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate220.errors : vErrors.concat(validate220.errors);
errors = vErrors.length;
}
var _valid0 = _errs7 === errors;
valid1 = valid1 || _valid0;
const _errs8 = errors;
if(data3 !== null){
const err6 = {instancePath:instancePath+"/reason_code",schemaPath:"#/properties/reason_code/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
var _valid0 = _errs8 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err7 = {instancePath:instancePath+"/reason_code",schemaPath:"#/properties/reason_code/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
else {
errors = _errs6;
if(vErrors !== null){
if(_errs6){
vErrors.length = _errs6;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err8 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
validate241.errors = vErrors;
return errors === 0;
}
validate241.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate247(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate247.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.authority_service_id === undefined) || (!(func0.call(data, "authority_service_id")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "authority_service_id"},message:"must have required property '"+"authority_service_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.database_instance_id === undefined) || (!(func0.call(data, "database_instance_id")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "database_instance_id"},message:"must have required property '"+"database_instance_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((key0 === "authority_service_id") || (key0 === "database_instance_id"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.authority_service_id !== undefined && func0.call(data, "authority_service_id")){
let data0 = data.authority_service_id;
if(typeof data0 === "string"){
if(func64(data0) > 128){
const err3 = {instancePath:instancePath+"/authority_service_id",schemaPath:"#/properties/authority_service_id/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(func64(data0) < 1){
const err4 = {instancePath:instancePath+"/authority_service_id",schemaPath:"#/properties/authority_service_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(!pattern11.test(data0)){
const err5 = {instancePath:instancePath+"/authority_service_id",schemaPath:"#/properties/authority_service_id/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_.:-]+(?![\\s\\S])"},message:"must match pattern \""+"^[A-Za-z0-9_.:-]+(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
else {
const err6 = {instancePath:instancePath+"/authority_service_id",schemaPath:"#/properties/authority_service_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.database_instance_id !== undefined && func0.call(data, "database_instance_id")){
let data1 = data.database_instance_id;
if(typeof data1 === "string"){
if(func64(data1) > 128){
const err7 = {instancePath:instancePath+"/database_instance_id",schemaPath:"#/properties/database_instance_id/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(func64(data1) < 1){
const err8 = {instancePath:instancePath+"/database_instance_id",schemaPath:"#/properties/database_instance_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!pattern11.test(data1)){
const err9 = {instancePath:instancePath+"/database_instance_id",schemaPath:"#/properties/database_instance_id/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_.:-]+(?![\\s\\S])"},message:"must match pattern \""+"^[A-Za-z0-9_.:-]+(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
else {
const err10 = {instancePath:instancePath+"/database_instance_id",schemaPath:"#/properties/database_instance_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
else {
const err11 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
validate247.errors = vErrors;
return errors === 0;
}
validate247.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate250(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate250.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(!pattern26.test(data)){
const err0 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^[1-9][0-9]{0,19}$(?![\\s\\S])"},message:"must match pattern \""+"^[1-9][0-9]{0,19}$(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate250.errors = vErrors;
return errors === 0;
}
validate250.evaluated = {"dynamicProps":false,"dynamicItems":false};


function validate252(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate252.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(!pattern27.test(data)){
const err0 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$(?![\\s\\S])"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate252.errors = vErrors;
return errors === 0;
}
validate252.evaluated = {"dynamicProps":false,"dynamicItems":false};

const schema78 = {"type":"object","properties":{"command_id":{"$ref":"#/$defs/command__V__S1_Id"},"scope":{"$ref":"#/$defs/command__V__S1_Scope"},"revision":{"$ref":"#/$defs/command__V__S1_PositiveCounter"},"phase":{"enum":["queued","dispatching","awaiting_evidence","finished"]},"outcome":{"enum":["pending","succeeded","failed","unknown","cancelled","expired","blocked"]},"effect_status":{"$ref":"#/$defs/command__V__S1_Effect"},"resource_status":{"enum":["held","clear","unresolved"]},"automation_continuation":{"enum":["eligible","paused_latched"]},"reason_code":{"anyOf":[{"$ref":"#/$defs/command__V__S1_Id"},{"type":"null"}]},"terminal_revision":{"anyOf":[{"$ref":"#/$defs/command__V__S1_PositiveCounter"},{"type":"null"}]},"resolution_ref":{"anyOf":[{"$ref":"#/$defs/command__V__S1_Ref"},{"type":"null"}]},"completion_evidence_count":{"type":"integer","minimum":0,"maximum":256,"xRawInteger":true},"resource_evidence_count":{"type":"integer","minimum":0,"maximum":256,"xRawInteger":true},"attempt_count":{"type":"integer","minimum":0,"maximum":256,"xRawInteger":true}},"required":["command_id","scope","revision","phase","outcome","effect_status","resource_status","automation_continuation","reason_code","terminal_revision","resolution_ref","completion_evidence_count","resource_evidence_count","attempt_count"],"additionalProperties":false,"allOf":[{"if":{"properties":{"phase":{"const":"finished"}}},"then":{"properties":{"outcome":{"not":{"const":"pending"}},"terminal_revision":{"$ref":"#/$defs/command__V__S1_PositiveCounter"}}},"else":{"properties":{"outcome":{"const":"pending"},"terminal_revision":{"type":"null"},"resolution_ref":{"type":"null"}}}},{"if":{"properties":{"outcome":{"enum":["failed","unknown","cancelled","expired","blocked"]}}},"then":{"properties":{"reason_code":{"$ref":"#/$defs/command__V__S1_Id"}}}},{"if":{"properties":{"outcome":{"enum":["unknown","blocked","expired"]}}},"then":{"properties":{"automation_continuation":{"const":"paused_latched"}}}},{"if":{"properties":{"outcome":{"const":"unknown"}}},"then":{"properties":{"effect_status":{"not":{"const":"not_sent"}}}}},{"if":{"properties":{"outcome":{"const":"unknown"},"resource_status":{"const":"clear"}}},"then":{"properties":{"resolution_ref":{"$ref":"#/$defs/command__V__S1_Ref"},"resource_evidence_count":{"type":"integer","minimum":1,"maximum":256,"xRawInteger":true}}}}]};

function validate257(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate257.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.id === undefined) || (!(func0.call(data, "id")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.revision === undefined) || (!(func0.call(data, "revision")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "revision"},message:"must have required property '"+"revision"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.digest === undefined) || (!(func0.call(data, "digest")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "digest"},message:"must have required property '"+"digest"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(((key0 === "id") || (key0 === "revision")) || (key0 === "digest"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.id !== undefined && func0.call(data, "id")){
if(!(validate234.call(this, data.id, {instancePath:instancePath+"/id",parentData:data,parentDataProperty:"id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate234.errors : vErrors.concat(validate234.errors);
errors = vErrors.length;
}
}
if(data.revision !== undefined && func0.call(data, "revision")){
if(!(validate236.call(this, data.revision, {instancePath:instancePath+"/revision",parentData:data,parentDataProperty:"revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate236.errors : vErrors.concat(validate236.errors);
errors = vErrors.length;
}
}
if(data.digest !== undefined && func0.call(data, "digest")){
if(!(validate238.call(this, data.digest, {instancePath:instancePath+"/digest",parentData:data,parentDataProperty:"digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate238.errors : vErrors.concat(validate238.errors);
errors = vErrors.length;
}
}
}
else {
const err4 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
validate257.errors = vErrors;
return errors === 0;
}
validate257.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate263(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate263.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.authority_service_id === undefined) || (!(func0.call(data, "authority_service_id")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "authority_service_id"},message:"must have required property '"+"authority_service_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.database_instance_id === undefined) || (!(func0.call(data, "database_instance_id")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "database_instance_id"},message:"must have required property '"+"database_instance_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((key0 === "authority_service_id") || (key0 === "database_instance_id"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.authority_service_id !== undefined && func0.call(data, "authority_service_id")){
let data0 = data.authority_service_id;
if(typeof data0 === "string"){
if(func64(data0) > 128){
const err3 = {instancePath:instancePath+"/authority_service_id",schemaPath:"#/properties/authority_service_id/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(func64(data0) < 1){
const err4 = {instancePath:instancePath+"/authority_service_id",schemaPath:"#/properties/authority_service_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(!pattern11.test(data0)){
const err5 = {instancePath:instancePath+"/authority_service_id",schemaPath:"#/properties/authority_service_id/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_.:-]+(?![\\s\\S])"},message:"must match pattern \""+"^[A-Za-z0-9_.:-]+(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
else {
const err6 = {instancePath:instancePath+"/authority_service_id",schemaPath:"#/properties/authority_service_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.database_instance_id !== undefined && func0.call(data, "database_instance_id")){
let data1 = data.database_instance_id;
if(typeof data1 === "string"){
if(func64(data1) > 128){
const err7 = {instancePath:instancePath+"/database_instance_id",schemaPath:"#/properties/database_instance_id/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(func64(data1) < 1){
const err8 = {instancePath:instancePath+"/database_instance_id",schemaPath:"#/properties/database_instance_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(!pattern11.test(data1)){
const err9 = {instancePath:instancePath+"/database_instance_id",schemaPath:"#/properties/database_instance_id/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_.:-]+(?![\\s\\S])"},message:"must match pattern \""+"^[A-Za-z0-9_.:-]+(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
else {
const err10 = {instancePath:instancePath+"/database_instance_id",schemaPath:"#/properties/database_instance_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
else {
const err11 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
validate263.errors = vErrors;
return errors === 0;
}
validate263.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema81 = {"enum":["not_sent","possible","acknowledged","verified","partial"]};

function validate266(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate266.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(((((data === "not_sent") || (data === "possible")) || (data === "acknowledged")) || (data === "verified")) || (data === "partial"))){
const err0 = {instancePath,schemaPath:"#/enum",keyword:"enum",params:{allowedValues: schema81.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
validate266.errors = vErrors;
return errors === 0;
}
validate266.evaluated = {"dynamicProps":false,"dynamicItems":false};


function validate254(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate254.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs2 = errors;
let valid1 = true;
const _errs3 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.phase !== undefined && func0.call(data, "phase")){
if("finished" !== data.phase){
const err0 = {};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
}
var _valid0 = _errs3 === errors;
errors = _errs2;
if(vErrors !== null){
if(_errs2){
vErrors.length = _errs2;
}
else {
vErrors = null;
}
}
let ifClause0;
if(_valid0){
const _errs5 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.outcome !== undefined && func0.call(data, "outcome")){
const _errs7 = errors;
const _errs8 = errors;
if("pending" !== data.outcome){
const err1 = {};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
var valid4 = _errs8 === errors;
if(valid4){
const err2 = {instancePath:instancePath+"/outcome",schemaPath:"#/allOf/0/then/properties/outcome/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
else {
errors = _errs7;
if(vErrors !== null){
if(_errs7){
vErrors.length = _errs7;
}
else {
vErrors = null;
}
}
}
}
if(data.terminal_revision !== undefined && func0.call(data, "terminal_revision")){
if(!(validate236.call(this, data.terminal_revision, {instancePath:instancePath+"/terminal_revision",parentData:data,parentDataProperty:"terminal_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate236.errors : vErrors.concat(validate236.errors);
errors = vErrors.length;
}
}
}
var _valid0 = _errs5 === errors;
valid1 = _valid0;
if(valid1){
var props0 = {};
props0.outcome = true;
props0.terminal_revision = true;
props0.phase = true;
}
ifClause0 = "then";
}
else {
const _errs10 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.outcome !== undefined && func0.call(data, "outcome")){
if("pending" !== data.outcome){
const err3 = {instancePath:instancePath+"/outcome",schemaPath:"#/allOf/0/else/properties/outcome/const",keyword:"const",params:{allowedValue: "pending"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.terminal_revision !== undefined && func0.call(data, "terminal_revision")){
if(data.terminal_revision !== null){
const err4 = {instancePath:instancePath+"/terminal_revision",schemaPath:"#/allOf/0/else/properties/terminal_revision/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.resolution_ref !== undefined && func0.call(data, "resolution_ref")){
if(data.resolution_ref !== null){
const err5 = {instancePath:instancePath+"/resolution_ref",schemaPath:"#/allOf/0/else/properties/resolution_ref/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
}
var _valid0 = _errs10 === errors;
valid1 = _valid0;
if(valid1){
if(props0 !== true){
props0 = props0 || {};
props0.outcome = true;
props0.terminal_revision = true;
props0.resolution_ref = true;
}
}
ifClause0 = "else";
}
if(!valid1){
const err6 = {instancePath,schemaPath:"#/allOf/0/if",keyword:"if",params:{failingKeyword: ifClause0},message:"must match \""+ifClause0+"\" schema"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
const _errs17 = errors;
let valid6 = true;
const _errs18 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.outcome !== undefined && func0.call(data, "outcome")){
let data6 = data.outcome;
if(!(((((data6 === "failed") || (data6 === "unknown")) || (data6 === "cancelled")) || (data6 === "expired")) || (data6 === "blocked"))){
const err7 = {};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
var _valid1 = _errs18 === errors;
errors = _errs17;
if(vErrors !== null){
if(_errs17){
vErrors.length = _errs17;
}
else {
vErrors = null;
}
}
if(_valid1){
const _errs20 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.reason_code !== undefined && func0.call(data, "reason_code")){
if(!(validate234.call(this, data.reason_code, {instancePath:instancePath+"/reason_code",parentData:data,parentDataProperty:"reason_code",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate234.errors : vErrors.concat(validate234.errors);
errors = vErrors.length;
}
}
}
var _valid1 = _errs20 === errors;
valid6 = _valid1;
if(valid6){
var props1 = {};
props1.reason_code = true;
props1.outcome = true;
}
}
if(!valid6){
const err8 = {instancePath,schemaPath:"#/allOf/1/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(props0 !== true && props1 !== undefined){
if(props1 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props1);
}
}
const _errs23 = errors;
let valid9 = true;
const _errs24 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.outcome !== undefined && func0.call(data, "outcome")){
let data8 = data.outcome;
if(!(((data8 === "unknown") || (data8 === "blocked")) || (data8 === "expired"))){
const err9 = {};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
}
var _valid2 = _errs24 === errors;
errors = _errs23;
if(vErrors !== null){
if(_errs23){
vErrors.length = _errs23;
}
else {
vErrors = null;
}
}
if(_valid2){
const _errs26 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.automation_continuation !== undefined && func0.call(data, "automation_continuation")){
if("paused_latched" !== data.automation_continuation){
const err10 = {instancePath:instancePath+"/automation_continuation",schemaPath:"#/allOf/2/then/properties/automation_continuation/const",keyword:"const",params:{allowedValue: "paused_latched"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
var _valid2 = _errs26 === errors;
valid9 = _valid2;
if(valid9){
var props2 = {};
props2.automation_continuation = true;
props2.outcome = true;
}
}
if(!valid9){
const err11 = {instancePath,schemaPath:"#/allOf/2/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(props0 !== true && props2 !== undefined){
if(props2 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props2);
}
}
const _errs29 = errors;
let valid12 = true;
const _errs30 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.outcome !== undefined && func0.call(data, "outcome")){
if("unknown" !== data.outcome){
const err12 = {};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
}
var _valid3 = _errs30 === errors;
errors = _errs29;
if(vErrors !== null){
if(_errs29){
vErrors.length = _errs29;
}
else {
vErrors = null;
}
}
if(_valid3){
const _errs32 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.effect_status !== undefined && func0.call(data, "effect_status")){
const _errs34 = errors;
const _errs35 = errors;
if("not_sent" !== data.effect_status){
const err13 = {};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
var valid15 = _errs35 === errors;
if(valid15){
const err14 = {instancePath:instancePath+"/effect_status",schemaPath:"#/allOf/3/then/properties/effect_status/not",keyword:"not",params:{},message:"must NOT be valid"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
else {
errors = _errs34;
if(vErrors !== null){
if(_errs34){
vErrors.length = _errs34;
}
else {
vErrors = null;
}
}
}
}
}
var _valid3 = _errs32 === errors;
valid12 = _valid3;
if(valid12){
var props3 = {};
props3.effect_status = true;
props3.outcome = true;
}
}
if(!valid12){
const err15 = {instancePath,schemaPath:"#/allOf/3/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(props0 !== true && props3 !== undefined){
if(props3 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props3);
}
}
const _errs37 = errors;
let valid16 = true;
const _errs38 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.outcome !== undefined && func0.call(data, "outcome")){
const _errs39 = errors;
if("unknown" !== data.outcome){
const err16 = {};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
var valid17 = _errs39 === errors;
}
else {
var valid17 = true;
}
if(valid17){
if(data.resource_status !== undefined && func0.call(data, "resource_status")){
const _errs40 = errors;
if("clear" !== data.resource_status){
const err17 = {};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
var valid17 = _errs40 === errors;
}
else {
var valid17 = true;
}
}
}
var _valid4 = _errs38 === errors;
errors = _errs37;
if(vErrors !== null){
if(_errs37){
vErrors.length = _errs37;
}
else {
vErrors = null;
}
}
if(_valid4){
const _errs41 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.resolution_ref !== undefined && func0.call(data, "resolution_ref")){
if(!(validate257.call(this, data.resolution_ref, {instancePath:instancePath+"/resolution_ref",parentData:data,parentDataProperty:"resolution_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate257.errors : vErrors.concat(validate257.errors);
errors = vErrors.length;
}
}
if(data.resource_evidence_count !== undefined && func0.call(data, "resource_evidence_count")){
let data15 = data.resource_evidence_count;
if(!((typeof data15 == "number") && (!(data15 % 1) && !isNaN(data15)))){
const err18 = {instancePath:instancePath+"/resource_evidence_count",schemaPath:"#/allOf/4/then/properties/resource_evidence_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(typeof data15 == "number"){
if(data15 > 256 || isNaN(data15)){
const err19 = {instancePath:instancePath+"/resource_evidence_count",schemaPath:"#/allOf/4/then/properties/resource_evidence_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 256},message:"must be <= 256"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data15 < 1 || isNaN(data15)){
const err20 = {instancePath:instancePath+"/resource_evidence_count",schemaPath:"#/allOf/4/then/properties/resource_evidence_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
const rawToken0 = this && this.numbers && this.numbers.get(instancePath + "/resource_evidence_count");
if(!rawToken0 || !rawToken0.integer || !rawToken0.safe){
const err21 = {instancePath:instancePath+"/resource_evidence_count",schemaPath:"#/allOf/4/then/properties/resource_evidence_count/xRawInteger",keyword:"xRawInteger",params:{},message:"must pass \"xRawInteger\" keyword validation"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
}
}
var _valid4 = _errs41 === errors;
valid16 = _valid4;
if(valid16){
var props4 = {};
props4.resolution_ref = true;
props4.resource_evidence_count = true;
props4.outcome = true;
props4.resource_status = true;
}
}
if(!valid16){
const err22 = {instancePath,schemaPath:"#/allOf/4/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(props0 !== true && props4 !== undefined){
if(props4 === true){
props0 = true;
}
else {
props0 = props0 || {};
Object.assign(props0, props4);
}
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.command_id === undefined) || (!(func0.call(data, "command_id")))){
const err23 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "command_id"},message:"must have required property '"+"command_id"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if((data.scope === undefined) || (!(func0.call(data, "scope")))){
const err24 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope"},message:"must have required property '"+"scope"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if((data.revision === undefined) || (!(func0.call(data, "revision")))){
const err25 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "revision"},message:"must have required property '"+"revision"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if((data.phase === undefined) || (!(func0.call(data, "phase")))){
const err26 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "phase"},message:"must have required property '"+"phase"+"'"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if((data.outcome === undefined) || (!(func0.call(data, "outcome")))){
const err27 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "outcome"},message:"must have required property '"+"outcome"+"'"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if((data.effect_status === undefined) || (!(func0.call(data, "effect_status")))){
const err28 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "effect_status"},message:"must have required property '"+"effect_status"+"'"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if((data.resource_status === undefined) || (!(func0.call(data, "resource_status")))){
const err29 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "resource_status"},message:"must have required property '"+"resource_status"+"'"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if((data.automation_continuation === undefined) || (!(func0.call(data, "automation_continuation")))){
const err30 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "automation_continuation"},message:"must have required property '"+"automation_continuation"+"'"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if((data.reason_code === undefined) || (!(func0.call(data, "reason_code")))){
const err31 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reason_code"},message:"must have required property '"+"reason_code"+"'"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if((data.terminal_revision === undefined) || (!(func0.call(data, "terminal_revision")))){
const err32 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "terminal_revision"},message:"must have required property '"+"terminal_revision"+"'"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if((data.resolution_ref === undefined) || (!(func0.call(data, "resolution_ref")))){
const err33 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "resolution_ref"},message:"must have required property '"+"resolution_ref"+"'"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if((data.completion_evidence_count === undefined) || (!(func0.call(data, "completion_evidence_count")))){
const err34 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "completion_evidence_count"},message:"must have required property '"+"completion_evidence_count"+"'"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if((data.resource_evidence_count === undefined) || (!(func0.call(data, "resource_evidence_count")))){
const err35 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "resource_evidence_count"},message:"must have required property '"+"resource_evidence_count"+"'"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if((data.attempt_count === undefined) || (!(func0.call(data, "attempt_count")))){
const err36 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "attempt_count"},message:"must have required property '"+"attempt_count"+"'"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(func0.call(schema78.properties, key0))){
const err37 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data.command_id !== undefined && func0.call(data, "command_id")){
if(!(validate234.call(this, data.command_id, {instancePath:instancePath+"/command_id",parentData:data,parentDataProperty:"command_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate234.errors : vErrors.concat(validate234.errors);
errors = vErrors.length;
}
}
if(data.scope !== undefined && func0.call(data, "scope")){
if(!(validate263.call(this, data.scope, {instancePath:instancePath+"/scope",parentData:data,parentDataProperty:"scope",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate263.errors : vErrors.concat(validate263.errors);
errors = vErrors.length;
}
}
if(data.revision !== undefined && func0.call(data, "revision")){
if(!(validate236.call(this, data.revision, {instancePath:instancePath+"/revision",parentData:data,parentDataProperty:"revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate236.errors : vErrors.concat(validate236.errors);
errors = vErrors.length;
}
}
if(data.phase !== undefined && func0.call(data, "phase")){
let data19 = data.phase;
if(!((((data19 === "queued") || (data19 === "dispatching")) || (data19 === "awaiting_evidence")) || (data19 === "finished"))){
const err38 = {instancePath:instancePath+"/phase",schemaPath:"#/properties/phase/enum",keyword:"enum",params:{allowedValues: schema78.properties.phase.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data.outcome !== undefined && func0.call(data, "outcome")){
let data20 = data.outcome;
if(!(((((((data20 === "pending") || (data20 === "succeeded")) || (data20 === "failed")) || (data20 === "unknown")) || (data20 === "cancelled")) || (data20 === "expired")) || (data20 === "blocked"))){
const err39 = {instancePath:instancePath+"/outcome",schemaPath:"#/properties/outcome/enum",keyword:"enum",params:{allowedValues: schema78.properties.outcome.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
if(data.effect_status !== undefined && func0.call(data, "effect_status")){
if(!(validate266.call(this, data.effect_status, {instancePath:instancePath+"/effect_status",parentData:data,parentDataProperty:"effect_status",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate266.errors : vErrors.concat(validate266.errors);
errors = vErrors.length;
}
}
if(data.resource_status !== undefined && func0.call(data, "resource_status")){
let data22 = data.resource_status;
if(!(((data22 === "held") || (data22 === "clear")) || (data22 === "unresolved"))){
const err40 = {instancePath:instancePath+"/resource_status",schemaPath:"#/properties/resource_status/enum",keyword:"enum",params:{allowedValues: schema78.properties.resource_status.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data.automation_continuation !== undefined && func0.call(data, "automation_continuation")){
let data23 = data.automation_continuation;
if(!((data23 === "eligible") || (data23 === "paused_latched"))){
const err41 = {instancePath:instancePath+"/automation_continuation",schemaPath:"#/properties/automation_continuation/enum",keyword:"enum",params:{allowedValues: schema78.properties.automation_continuation.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data.reason_code !== undefined && func0.call(data, "reason_code")){
let data24 = data.reason_code;
const _errs55 = errors;
let valid20 = false;
const _errs56 = errors;
if(!(validate234.call(this, data24, {instancePath:instancePath+"/reason_code",parentData:data,parentDataProperty:"reason_code",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate234.errors : vErrors.concat(validate234.errors);
errors = vErrors.length;
}
var _valid5 = _errs56 === errors;
valid20 = valid20 || _valid5;
const _errs57 = errors;
if(data24 !== null){
const err42 = {instancePath:instancePath+"/reason_code",schemaPath:"#/properties/reason_code/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
var _valid5 = _errs57 === errors;
valid20 = valid20 || _valid5;
if(!valid20){
const err43 = {instancePath:instancePath+"/reason_code",schemaPath:"#/properties/reason_code/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
else {
errors = _errs55;
if(vErrors !== null){
if(_errs55){
vErrors.length = _errs55;
}
else {
vErrors = null;
}
}
}
}
if(data.terminal_revision !== undefined && func0.call(data, "terminal_revision")){
let data25 = data.terminal_revision;
const _errs60 = errors;
let valid21 = false;
const _errs61 = errors;
if(!(validate236.call(this, data25, {instancePath:instancePath+"/terminal_revision",parentData:data,parentDataProperty:"terminal_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate236.errors : vErrors.concat(validate236.errors);
errors = vErrors.length;
}
var _valid6 = _errs61 === errors;
valid21 = valid21 || _valid6;
const _errs62 = errors;
if(data25 !== null){
const err44 = {instancePath:instancePath+"/terminal_revision",schemaPath:"#/properties/terminal_revision/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
var _valid6 = _errs62 === errors;
valid21 = valid21 || _valid6;
if(!valid21){
const err45 = {instancePath:instancePath+"/terminal_revision",schemaPath:"#/properties/terminal_revision/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
else {
errors = _errs60;
if(vErrors !== null){
if(_errs60){
vErrors.length = _errs60;
}
else {
vErrors = null;
}
}
}
}
if(data.resolution_ref !== undefined && func0.call(data, "resolution_ref")){
let data26 = data.resolution_ref;
const _errs65 = errors;
let valid22 = false;
const _errs66 = errors;
if(!(validate257.call(this, data26, {instancePath:instancePath+"/resolution_ref",parentData:data,parentDataProperty:"resolution_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate257.errors : vErrors.concat(validate257.errors);
errors = vErrors.length;
}
var _valid7 = _errs66 === errors;
valid22 = valid22 || _valid7;
const _errs67 = errors;
if(data26 !== null){
const err46 = {instancePath:instancePath+"/resolution_ref",schemaPath:"#/properties/resolution_ref/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
var _valid7 = _errs67 === errors;
valid22 = valid22 || _valid7;
if(!valid22){
const err47 = {instancePath:instancePath+"/resolution_ref",schemaPath:"#/properties/resolution_ref/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
else {
errors = _errs65;
if(vErrors !== null){
if(_errs65){
vErrors.length = _errs65;
}
else {
vErrors = null;
}
}
}
}
if(data.completion_evidence_count !== undefined && func0.call(data, "completion_evidence_count")){
let data27 = data.completion_evidence_count;
if(!((typeof data27 == "number") && (!(data27 % 1) && !isNaN(data27)))){
const err48 = {instancePath:instancePath+"/completion_evidence_count",schemaPath:"#/properties/completion_evidence_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(typeof data27 == "number"){
if(data27 > 256 || isNaN(data27)){
const err49 = {instancePath:instancePath+"/completion_evidence_count",schemaPath:"#/properties/completion_evidence_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 256},message:"must be <= 256"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if(data27 < 0 || isNaN(data27)){
const err50 = {instancePath:instancePath+"/completion_evidence_count",schemaPath:"#/properties/completion_evidence_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
const rawToken1 = this && this.numbers && this.numbers.get(instancePath + "/completion_evidence_count");
if(!rawToken1 || !rawToken1.integer || !rawToken1.safe){
const err51 = {instancePath:instancePath+"/completion_evidence_count",schemaPath:"#/properties/completion_evidence_count/xRawInteger",keyword:"xRawInteger",params:{},message:"must pass \"xRawInteger\" keyword validation"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
}
if(data.resource_evidence_count !== undefined && func0.call(data, "resource_evidence_count")){
let data28 = data.resource_evidence_count;
if(!((typeof data28 == "number") && (!(data28 % 1) && !isNaN(data28)))){
const err52 = {instancePath:instancePath+"/resource_evidence_count",schemaPath:"#/properties/resource_evidence_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if(typeof data28 == "number"){
if(data28 > 256 || isNaN(data28)){
const err53 = {instancePath:instancePath+"/resource_evidence_count",schemaPath:"#/properties/resource_evidence_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 256},message:"must be <= 256"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(data28 < 0 || isNaN(data28)){
const err54 = {instancePath:instancePath+"/resource_evidence_count",schemaPath:"#/properties/resource_evidence_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
const rawToken2 = this && this.numbers && this.numbers.get(instancePath + "/resource_evidence_count");
if(!rawToken2 || !rawToken2.integer || !rawToken2.safe){
const err55 = {instancePath:instancePath+"/resource_evidence_count",schemaPath:"#/properties/resource_evidence_count/xRawInteger",keyword:"xRawInteger",params:{},message:"must pass \"xRawInteger\" keyword validation"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
}
if(data.attempt_count !== undefined && func0.call(data, "attempt_count")){
let data29 = data.attempt_count;
if(!((typeof data29 == "number") && (!(data29 % 1) && !isNaN(data29)))){
const err56 = {instancePath:instancePath+"/attempt_count",schemaPath:"#/properties/attempt_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if(typeof data29 == "number"){
if(data29 > 256 || isNaN(data29)){
const err57 = {instancePath:instancePath+"/attempt_count",schemaPath:"#/properties/attempt_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 256},message:"must be <= 256"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(data29 < 0 || isNaN(data29)){
const err58 = {instancePath:instancePath+"/attempt_count",schemaPath:"#/properties/attempt_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
const rawToken3 = this && this.numbers && this.numbers.get(instancePath + "/attempt_count");
if(!rawToken3 || !rawToken3.integer || !rawToken3.safe){
const err59 = {instancePath:instancePath+"/attempt_count",schemaPath:"#/properties/attempt_count/xRawInteger",keyword:"xRawInteger",params:{},message:"must pass \"xRawInteger\" keyword validation"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
}
}
else {
const err60 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
validate254.errors = vErrors;
return errors === 0;
}
validate254.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema82 = {"enum":["sent","acknowledged","effect_verified"]};

function validate272(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate272.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!(((data === "sent") || (data === "acknowledged")) || (data === "effect_verified"))){
const err0 = {instancePath,schemaPath:"#/enum",keyword:"enum",params:{allowedValues: schema82.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
validate272.errors = vErrors;
return errors === 0;
}
validate272.evaluated = {"dynamicProps":false,"dynamicItems":false};


function validate195(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate195.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.initial_command_ref === undefined) || (!(func0.call(data, "initial_command_ref")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "initial_command_ref"},message:"must have required property '"+"initial_command_ref"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.request_identity === undefined) || (!(func0.call(data, "request_identity")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "request_identity"},message:"must have required property '"+"request_identity"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.target === undefined) || (!(func0.call(data, "target")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "target"},message:"must have required property '"+"target"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.origin === undefined) || (!(func0.call(data, "origin")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "origin"},message:"must have required property '"+"origin"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.accepted_at === undefined) || (!(func0.call(data, "accepted_at")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "accepted_at"},message:"must have required property '"+"accepted_at"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.control_binding === undefined) || (!(func0.call(data, "control_binding")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "control_binding"},message:"must have required property '"+"control_binding"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.state_ref === undefined) || (!(func0.call(data, "state_ref")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "state_ref"},message:"must have required property '"+"state_ref"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if((data.cancellation === undefined) || (!(func0.call(data, "cancellation")))){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "cancellation"},message:"must have required property '"+"cancellation"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if((data.source_record_ref === undefined) || (!(func0.call(data, "source_record_ref")))){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_record_ref"},message:"must have required property '"+"source_record_ref"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if((data.state === undefined) || (!(func0.call(data, "state")))){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "state"},message:"must have required property '"+"state"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if((data.completion === undefined) || (!(func0.call(data, "completion")))){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "completion"},message:"must have required property '"+"completion"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(func0.call(schema52.properties, key0))){
const err11 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.initial_command_ref !== undefined && func0.call(data, "initial_command_ref")){
if(!(validate196.call(this, data.initial_command_ref, {instancePath:instancePath+"/initial_command_ref",parentData:data,parentDataProperty:"initial_command_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate196.errors : vErrors.concat(validate196.errors);
errors = vErrors.length;
}
}
if(data.request_identity !== undefined && func0.call(data, "request_identity")){
if(!(validate206.call(this, data.request_identity, {instancePath:instancePath+"/request_identity",parentData:data,parentDataProperty:"request_identity",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate206.errors : vErrors.concat(validate206.errors);
errors = vErrors.length;
}
}
if(data.target !== undefined && func0.call(data, "target")){
let data2 = data.target;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if((data2.device_id === undefined) || (!(func0.call(data2, "device_id")))){
const err12 = {instancePath:instancePath+"/target",schemaPath:"#/properties/target/required",keyword:"required",params:{missingProperty: "device_id"},message:"must have required property '"+"device_id"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if((data2.action_id === undefined) || (!(func0.call(data2, "action_id")))){
const err13 = {instancePath:instancePath+"/target",schemaPath:"#/properties/target/required",keyword:"required",params:{missingProperty: "action_id"},message:"must have required property '"+"action_id"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if((data2.capability_version === undefined) || (!(func0.call(data2, "capability_version")))){
const err14 = {instancePath:instancePath+"/target",schemaPath:"#/properties/target/required",keyword:"required",params:{missingProperty: "capability_version"},message:"must have required property '"+"capability_version"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
for(const key1 of Object.keys(data2)){
if(!(((key1 === "device_id") || (key1 === "action_id")) || (key1 === "capability_version"))){
const err15 = {instancePath:instancePath+"/target",schemaPath:"#/properties/target/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data2.device_id !== undefined && func0.call(data2, "device_id")){
if(!(validate220.call(this, data2.device_id, {instancePath:instancePath+"/target/device_id",parentData:data2,parentDataProperty:"device_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate220.errors : vErrors.concat(validate220.errors);
errors = vErrors.length;
}
}
if(data2.action_id !== undefined && func0.call(data2, "action_id")){
if(!(validate220.call(this, data2.action_id, {instancePath:instancePath+"/target/action_id",parentData:data2,parentDataProperty:"action_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate220.errors : vErrors.concat(validate220.errors);
errors = vErrors.length;
}
}
if(data2.capability_version !== undefined && func0.call(data2, "capability_version")){
if(!(validate223.call(this, data2.capability_version, {instancePath:instancePath+"/target/capability_version",parentData:data2,parentDataProperty:"capability_version",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate223.errors : vErrors.concat(validate223.errors);
errors = vErrors.length;
}
}
}
else {
const err16 = {instancePath:instancePath+"/target",schemaPath:"#/properties/target/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.origin !== undefined && func0.call(data, "origin")){
let data6 = data.origin;
if(!((data6 === "manual") || (data6 === "automation"))){
const err17 = {instancePath:instancePath+"/origin",schemaPath:"#/properties/origin/enum",keyword:"enum",params:{allowedValues: schema52.properties.origin.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.accepted_at !== undefined && func0.call(data, "accepted_at")){
if(!(validate225.call(this, data.accepted_at, {instancePath:instancePath+"/accepted_at",parentData:data,parentDataProperty:"accepted_at",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate225.errors : vErrors.concat(validate225.errors);
errors = vErrors.length;
}
}
if(data.control_binding !== undefined && func0.call(data, "control_binding")){
if(!(validate227.call(this, data.control_binding, {instancePath:instancePath+"/control_binding",parentData:data,parentDataProperty:"control_binding",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate227.errors : vErrors.concat(validate227.errors);
errors = vErrors.length;
}
}
if(data.state_ref !== undefined && func0.call(data, "state_ref")){
if(!(validate233.call(this, data.state_ref, {instancePath:instancePath+"/state_ref",parentData:data,parentDataProperty:"state_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate233.errors : vErrors.concat(validate233.errors);
errors = vErrors.length;
}
}
if(data.cancellation !== undefined && func0.call(data, "cancellation")){
let data10 = data.cancellation;
const _errs15 = errors;
let valid2 = false;
const _errs16 = errors;
if(!(validate241.call(this, data10, {instancePath:instancePath+"/cancellation",parentData:data,parentDataProperty:"cancellation",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate241.errors : vErrors.concat(validate241.errors);
errors = vErrors.length;
}
var _valid0 = _errs16 === errors;
valid2 = valid2 || _valid0;
const _errs17 = errors;
if(data10 !== null){
const err18 = {instancePath:instancePath+"/cancellation",schemaPath:"#/properties/cancellation/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
var _valid0 = _errs17 === errors;
valid2 = valid2 || _valid0;
if(!valid2){
const err19 = {instancePath:instancePath+"/cancellation",schemaPath:"#/properties/cancellation/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
else {
errors = _errs15;
if(vErrors !== null){
if(_errs15){
vErrors.length = _errs15;
}
else {
vErrors = null;
}
}
}
}
if(data.source_record_ref !== undefined && func0.call(data, "source_record_ref")){
let data11 = data.source_record_ref;
if(data11 && typeof data11 == "object" && !Array.isArray(data11)){
if((data11.kind === undefined) || (!(func0.call(data11, "kind")))){
const err20 = {instancePath:instancePath+"/source_record_ref",schemaPath:"#/properties/source_record_ref/required",keyword:"required",params:{missingProperty: "kind"},message:"must have required property '"+"kind"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if((data11.scope === undefined) || (!(func0.call(data11, "scope")))){
const err21 = {instancePath:instancePath+"/source_record_ref",schemaPath:"#/properties/source_record_ref/required",keyword:"required",params:{missingProperty: "scope"},message:"must have required property '"+"scope"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if((data11.object_id === undefined) || (!(func0.call(data11, "object_id")))){
const err22 = {instancePath:instancePath+"/source_record_ref",schemaPath:"#/properties/source_record_ref/required",keyword:"required",params:{missingProperty: "object_id"},message:"must have required property '"+"object_id"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if((data11.revision === undefined) || (!(func0.call(data11, "revision")))){
const err23 = {instancePath:instancePath+"/source_record_ref",schemaPath:"#/properties/source_record_ref/required",keyword:"required",params:{missingProperty: "revision"},message:"must have required property '"+"revision"+"'"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if((data11.digest === undefined) || (!(func0.call(data11, "digest")))){
const err24 = {instancePath:instancePath+"/source_record_ref",schemaPath:"#/properties/source_record_ref/required",keyword:"required",params:{missingProperty: "digest"},message:"must have required property '"+"digest"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
for(const key2 of Object.keys(data11)){
if(!(((((key2 === "kind") || (key2 === "scope")) || (key2 === "object_id")) || (key2 === "revision")) || (key2 === "digest"))){
const err25 = {instancePath:instancePath+"/source_record_ref",schemaPath:"#/properties/source_record_ref/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data11.kind !== undefined && func0.call(data11, "kind")){
if("command" !== data11.kind){
const err26 = {instancePath:instancePath+"/source_record_ref/kind",schemaPath:"#/properties/source_record_ref/properties/kind/const",keyword:"const",params:{allowedValue: "command"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data11.scope !== undefined && func0.call(data11, "scope")){
if(!(validate247.call(this, data11.scope, {instancePath:instancePath+"/source_record_ref/scope",parentData:data11,parentDataProperty:"scope",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate247.errors : vErrors.concat(validate247.errors);
errors = vErrors.length;
}
}
if(data11.object_id !== undefined && func0.call(data11, "object_id")){
if(!(validate220.call(this, data11.object_id, {instancePath:instancePath+"/source_record_ref/object_id",parentData:data11,parentDataProperty:"object_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate220.errors : vErrors.concat(validate220.errors);
errors = vErrors.length;
}
}
if(data11.revision !== undefined && func0.call(data11, "revision")){
if(!(validate250.call(this, data11.revision, {instancePath:instancePath+"/source_record_ref/revision",parentData:data11,parentDataProperty:"revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate250.errors : vErrors.concat(validate250.errors);
errors = vErrors.length;
}
}
if(data11.digest !== undefined && func0.call(data11, "digest")){
if(!(validate252.call(this, data11.digest, {instancePath:instancePath+"/source_record_ref/digest",parentData:data11,parentDataProperty:"digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate252.errors : vErrors.concat(validate252.errors);
errors = vErrors.length;
}
}
}
else {
const err27 = {instancePath:instancePath+"/source_record_ref",schemaPath:"#/properties/source_record_ref/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.state !== undefined && func0.call(data, "state")){
if(!(validate254.call(this, data.state, {instancePath:instancePath+"/state",parentData:data,parentDataProperty:"state",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate254.errors : vErrors.concat(validate254.errors);
errors = vErrors.length;
}
}
if(data.completion !== undefined && func0.call(data, "completion")){
let data18 = data.completion;
if(data18 && typeof data18 == "object" && !Array.isArray(data18)){
if((data18.required === undefined) || (!(func0.call(data18, "required")))){
const err28 = {instancePath:instancePath+"/completion",schemaPath:"#/properties/completion/required",keyword:"required",params:{missingProperty: "required"},message:"must have required property '"+"required"+"'"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if((data18.achieved === undefined) || (!(func0.call(data18, "achieved")))){
const err29 = {instancePath:instancePath+"/completion",schemaPath:"#/properties/completion/required",keyword:"required",params:{missingProperty: "achieved"},message:"must have required property '"+"achieved"+"'"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if((data18.policy_ref === undefined) || (!(func0.call(data18, "policy_ref")))){
const err30 = {instancePath:instancePath+"/completion",schemaPath:"#/properties/completion/required",keyword:"required",params:{missingProperty: "policy_ref"},message:"must have required property '"+"policy_ref"+"'"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if((data18.evidence_count === undefined) || (!(func0.call(data18, "evidence_count")))){
const err31 = {instancePath:instancePath+"/completion",schemaPath:"#/properties/completion/required",keyword:"required",params:{missingProperty: "evidence_count"},message:"must have required property '"+"evidence_count"+"'"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
for(const key3 of Object.keys(data18)){
if(!((((key3 === "required") || (key3 === "achieved")) || (key3 === "policy_ref")) || (key3 === "evidence_count"))){
const err32 = {instancePath:instancePath+"/completion",schemaPath:"#/properties/completion/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data18.required !== undefined && func0.call(data18, "required")){
if(!(validate272.call(this, data18.required, {instancePath:instancePath+"/completion/required",parentData:data18,parentDataProperty:"required",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate272.errors : vErrors.concat(validate272.errors);
errors = vErrors.length;
}
}
if(data18.achieved !== undefined && func0.call(data18, "achieved")){
let data20 = data18.achieved;
const _errs33 = errors;
let valid5 = false;
const _errs34 = errors;
if(!(validate272.call(this, data20, {instancePath:instancePath+"/completion/achieved",parentData:data18,parentDataProperty:"achieved",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate272.errors : vErrors.concat(validate272.errors);
errors = vErrors.length;
}
var _valid1 = _errs34 === errors;
valid5 = valid5 || _valid1;
const _errs35 = errors;
if(data20 !== null){
const err33 = {instancePath:instancePath+"/completion/achieved",schemaPath:"#/properties/completion/properties/achieved/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
var _valid1 = _errs35 === errors;
valid5 = valid5 || _valid1;
if(!valid5){
const err34 = {instancePath:instancePath+"/completion/achieved",schemaPath:"#/properties/completion/properties/achieved/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
else {
errors = _errs33;
if(vErrors !== null){
if(_errs33){
vErrors.length = _errs33;
}
else {
vErrors = null;
}
}
}
}
if(data18.policy_ref !== undefined && func0.call(data18, "policy_ref")){
if(!(validate233.call(this, data18.policy_ref, {instancePath:instancePath+"/completion/policy_ref",parentData:data18,parentDataProperty:"policy_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate233.errors : vErrors.concat(validate233.errors);
errors = vErrors.length;
}
}
if(data18.evidence_count !== undefined && func0.call(data18, "evidence_count")){
let data22 = data18.evidence_count;
if(!((typeof data22 == "number") && (!(data22 % 1) && !isNaN(data22)))){
const err35 = {instancePath:instancePath+"/completion/evidence_count",schemaPath:"#/properties/completion/properties/evidence_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if(typeof data22 == "number"){
if(data22 > 256 || isNaN(data22)){
const err36 = {instancePath:instancePath+"/completion/evidence_count",schemaPath:"#/properties/completion/properties/evidence_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 256},message:"must be <= 256"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(data22 < 0 || isNaN(data22)){
const err37 = {instancePath:instancePath+"/completion/evidence_count",schemaPath:"#/properties/completion/properties/evidence_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
const rawToken0 = this && this.numbers && this.numbers.get(instancePath + "/completion/evidence_count");
if(!rawToken0 || !rawToken0.integer || !rawToken0.safe){
const err38 = {instancePath:instancePath+"/completion/evidence_count",schemaPath:"#/properties/completion/properties/evidence_count/xRawInteger",keyword:"xRawInteger",params:{},message:"must pass \"xRawInteger\" keyword validation"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
}
}
else {
const err39 = {instancePath:instancePath+"/completion",schemaPath:"#/properties/completion/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
}
else {
const err40 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
validate195.errors = vErrors;
return errors === 0;
}
validate195.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema83 = {"type":"object","properties":{"device_ref":{"$ref":"#/$defs/snapshot__ObjectRef"},"control_epoch":{"$ref":"#/$defs/snapshot__Id"},"effective_version":{"$ref":"#/$defs/snapshot__Counter"},"effective_holder_id":{"anyOf":[{"$ref":"#/$defs/snapshot__Id"},{"type":"null"}]},"mode":{"enum":["manual","automatic"]},"gate_state":{"enum":["ready","fencing","protected"]},"pending_change":{"anyOf":[{"$ref":"#/$defs/snapshot__PendingControl"},{"type":"null"}]},"transfers":{"type":"array","items":{"$ref":"#/$defs/snapshot__Transfer"},"maxItems":32},"in_flight_commands":{"type":"array","items":{"$ref":"#/$defs/snapshot__ObjectRef"},"maxItems":256},"unresolved_commands":{"type":"array","items":{"$ref":"#/$defs/snapshot__ObjectRef"},"maxItems":256}},"required":["device_ref","control_epoch","effective_version","effective_holder_id","mode","gate_state","pending_change","transfers","in_flight_commands","unresolved_commands"],"additionalProperties":false};
const schema84 = {"type":"object","properties":{"operation_ref":{"$ref":"#/$defs/snapshot__ObjectRef"},"target_version":{"$ref":"#/$defs/snapshot__Counter"},"target_holder_id":{"anyOf":[{"$ref":"#/$defs/snapshot__Id"},{"type":"null"}]},"target_mode":{"enum":["manual","automatic"]},"state":{"enum":["pending","effective","rejected","indeterminate"]},"reason_code":{"$ref":"#/$defs/snapshot__Id"}},"required":["operation_ref","target_version","target_holder_id","target_mode","state","reason_code"],"additionalProperties":false};

function validate285(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate285.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.operation_ref === undefined) || (!(func0.call(data, "operation_ref")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "operation_ref"},message:"must have required property '"+"operation_ref"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.target_version === undefined) || (!(func0.call(data, "target_version")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "target_version"},message:"must have required property '"+"target_version"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.target_holder_id === undefined) || (!(func0.call(data, "target_holder_id")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "target_holder_id"},message:"must have required property '"+"target_holder_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.target_mode === undefined) || (!(func0.call(data, "target_mode")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "target_mode"},message:"must have required property '"+"target_mode"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.state === undefined) || (!(func0.call(data, "state")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "state"},message:"must have required property '"+"state"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.reason_code === undefined) || (!(func0.call(data, "reason_code")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reason_code"},message:"must have required property '"+"reason_code"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((((((key0 === "operation_ref") || (key0 === "target_version")) || (key0 === "target_holder_id")) || (key0 === "target_mode")) || (key0 === "state")) || (key0 === "reason_code"))){
const err6 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.operation_ref !== undefined && func0.call(data, "operation_ref")){
if(!(validate170.call(this, data.operation_ref, {instancePath:instancePath+"/operation_ref",parentData:data,parentDataProperty:"operation_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
if(data.target_version !== undefined && func0.call(data, "target_version")){
if(!(validate101.call(this, data.target_version, {instancePath:instancePath+"/target_version",parentData:data,parentDataProperty:"target_version",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.target_holder_id !== undefined && func0.call(data, "target_holder_id")){
let data2 = data.target_holder_id;
const _errs5 = errors;
let valid1 = false;
const _errs6 = errors;
if(!(validate93.call(this, data2, {instancePath:instancePath+"/target_holder_id",parentData:data,parentDataProperty:"target_holder_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
var _valid0 = _errs6 === errors;
valid1 = valid1 || _valid0;
const _errs7 = errors;
if(data2 !== null){
const err7 = {instancePath:instancePath+"/target_holder_id",schemaPath:"#/properties/target_holder_id/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
var _valid0 = _errs7 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err8 = {instancePath:instancePath+"/target_holder_id",schemaPath:"#/properties/target_holder_id/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
else {
errors = _errs5;
if(vErrors !== null){
if(_errs5){
vErrors.length = _errs5;
}
else {
vErrors = null;
}
}
}
}
if(data.target_mode !== undefined && func0.call(data, "target_mode")){
let data3 = data.target_mode;
if(!((data3 === "manual") || (data3 === "automatic"))){
const err9 = {instancePath:instancePath+"/target_mode",schemaPath:"#/properties/target_mode/enum",keyword:"enum",params:{allowedValues: schema84.properties.target_mode.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.state !== undefined && func0.call(data, "state")){
let data4 = data.state;
if(!((((data4 === "pending") || (data4 === "effective")) || (data4 === "rejected")) || (data4 === "indeterminate"))){
const err10 = {instancePath:instancePath+"/state",schemaPath:"#/properties/state/enum",keyword:"enum",params:{allowedValues: schema84.properties.state.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.reason_code !== undefined && func0.call(data, "reason_code")){
if(!(validate93.call(this, data.reason_code, {instancePath:instancePath+"/reason_code",parentData:data,parentDataProperty:"reason_code",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
}
else {
const err11 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
validate285.errors = vErrors;
return errors === 0;
}
validate285.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema85 = {"type":"object","properties":{"transfer_ref":{"$ref":"#/$defs/snapshot__ObjectRef"},"from_principal_id":{"$ref":"#/$defs/snapshot__Id"},"target_principal_id":{"$ref":"#/$defs/snapshot__Id"},"expected_control_epoch":{"$ref":"#/$defs/snapshot__Id"},"expected_effective_version":{"$ref":"#/$defs/snapshot__Counter"},"expires_at":{"$ref":"#/$defs/snapshot__Timestamp"},"state":{"enum":["offered","accepted","expired","cancelled"]},"accept_operation_ref":{"anyOf":[{"$ref":"#/$defs/snapshot__ObjectRef"},{"type":"null"}]}},"required":["transfer_ref","from_principal_id","target_principal_id","expected_control_epoch","expected_effective_version","expires_at","state","accept_operation_ref"],"additionalProperties":false};
const schema86 = {"type":"string","format":"date-time","maxLength":40};

function validate297(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate297.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func64(data) > 40){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 40},message:"must NOT have more than 40 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(!(formats0.validate(data))){
const err1 = {instancePath,schemaPath:"#/format",keyword:"format",params:{format: "date-time"},message:"must match format \""+"date-time"+"\""};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
else {
const err2 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
validate297.errors = vErrors;
return errors === 0;
}
validate297.evaluated = {"dynamicProps":false,"dynamicItems":false};


function validate291(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate291.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.transfer_ref === undefined) || (!(func0.call(data, "transfer_ref")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "transfer_ref"},message:"must have required property '"+"transfer_ref"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.from_principal_id === undefined) || (!(func0.call(data, "from_principal_id")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "from_principal_id"},message:"must have required property '"+"from_principal_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.target_principal_id === undefined) || (!(func0.call(data, "target_principal_id")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "target_principal_id"},message:"must have required property '"+"target_principal_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.expected_control_epoch === undefined) || (!(func0.call(data, "expected_control_epoch")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "expected_control_epoch"},message:"must have required property '"+"expected_control_epoch"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.expected_effective_version === undefined) || (!(func0.call(data, "expected_effective_version")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "expected_effective_version"},message:"must have required property '"+"expected_effective_version"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.expires_at === undefined) || (!(func0.call(data, "expires_at")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "expires_at"},message:"must have required property '"+"expires_at"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.state === undefined) || (!(func0.call(data, "state")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "state"},message:"must have required property '"+"state"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if((data.accept_operation_ref === undefined) || (!(func0.call(data, "accept_operation_ref")))){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "accept_operation_ref"},message:"must have required property '"+"accept_operation_ref"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((((((((key0 === "transfer_ref") || (key0 === "from_principal_id")) || (key0 === "target_principal_id")) || (key0 === "expected_control_epoch")) || (key0 === "expected_effective_version")) || (key0 === "expires_at")) || (key0 === "state")) || (key0 === "accept_operation_ref"))){
const err8 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.transfer_ref !== undefined && func0.call(data, "transfer_ref")){
if(!(validate170.call(this, data.transfer_ref, {instancePath:instancePath+"/transfer_ref",parentData:data,parentDataProperty:"transfer_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
if(data.from_principal_id !== undefined && func0.call(data, "from_principal_id")){
if(!(validate93.call(this, data.from_principal_id, {instancePath:instancePath+"/from_principal_id",parentData:data,parentDataProperty:"from_principal_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.target_principal_id !== undefined && func0.call(data, "target_principal_id")){
if(!(validate93.call(this, data.target_principal_id, {instancePath:instancePath+"/target_principal_id",parentData:data,parentDataProperty:"target_principal_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.expected_control_epoch !== undefined && func0.call(data, "expected_control_epoch")){
if(!(validate93.call(this, data.expected_control_epoch, {instancePath:instancePath+"/expected_control_epoch",parentData:data,parentDataProperty:"expected_control_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.expected_effective_version !== undefined && func0.call(data, "expected_effective_version")){
if(!(validate101.call(this, data.expected_effective_version, {instancePath:instancePath+"/expected_effective_version",parentData:data,parentDataProperty:"expected_effective_version",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.expires_at !== undefined && func0.call(data, "expires_at")){
if(!(validate297.call(this, data.expires_at, {instancePath:instancePath+"/expires_at",parentData:data,parentDataProperty:"expires_at",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate297.errors : vErrors.concat(validate297.errors);
errors = vErrors.length;
}
}
if(data.state !== undefined && func0.call(data, "state")){
let data6 = data.state;
if(!((((data6 === "offered") || (data6 === "accepted")) || (data6 === "expired")) || (data6 === "cancelled"))){
const err9 = {instancePath:instancePath+"/state",schemaPath:"#/properties/state/enum",keyword:"enum",params:{allowedValues: schema85.properties.state.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.accept_operation_ref !== undefined && func0.call(data, "accept_operation_ref")){
let data7 = data.accept_operation_ref;
const _errs10 = errors;
let valid1 = false;
const _errs11 = errors;
if(!(validate170.call(this, data7, {instancePath:instancePath+"/accept_operation_ref",parentData:data,parentDataProperty:"accept_operation_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
var _valid0 = _errs11 === errors;
valid1 = valid1 || _valid0;
const _errs12 = errors;
if(data7 !== null){
const err10 = {instancePath:instancePath+"/accept_operation_ref",schemaPath:"#/properties/accept_operation_ref/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
var _valid0 = _errs12 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err11 = {instancePath:instancePath+"/accept_operation_ref",schemaPath:"#/properties/accept_operation_ref/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
else {
errors = _errs10;
if(vErrors !== null){
if(_errs10){
vErrors.length = _errs10;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err12 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
validate291.errors = vErrors;
return errors === 0;
}
validate291.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate280(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate280.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.device_ref === undefined) || (!(func0.call(data, "device_ref")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "device_ref"},message:"must have required property '"+"device_ref"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.control_epoch === undefined) || (!(func0.call(data, "control_epoch")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "control_epoch"},message:"must have required property '"+"control_epoch"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.effective_version === undefined) || (!(func0.call(data, "effective_version")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "effective_version"},message:"must have required property '"+"effective_version"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.effective_holder_id === undefined) || (!(func0.call(data, "effective_holder_id")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "effective_holder_id"},message:"must have required property '"+"effective_holder_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.mode === undefined) || (!(func0.call(data, "mode")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.gate_state === undefined) || (!(func0.call(data, "gate_state")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "gate_state"},message:"must have required property '"+"gate_state"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.pending_change === undefined) || (!(func0.call(data, "pending_change")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "pending_change"},message:"must have required property '"+"pending_change"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if((data.transfers === undefined) || (!(func0.call(data, "transfers")))){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "transfers"},message:"must have required property '"+"transfers"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if((data.in_flight_commands === undefined) || (!(func0.call(data, "in_flight_commands")))){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "in_flight_commands"},message:"must have required property '"+"in_flight_commands"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if((data.unresolved_commands === undefined) || (!(func0.call(data, "unresolved_commands")))){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "unresolved_commands"},message:"must have required property '"+"unresolved_commands"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(func0.call(schema83.properties, key0))){
const err10 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.device_ref !== undefined && func0.call(data, "device_ref")){
if(!(validate170.call(this, data.device_ref, {instancePath:instancePath+"/device_ref",parentData:data,parentDataProperty:"device_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
if(data.control_epoch !== undefined && func0.call(data, "control_epoch")){
if(!(validate93.call(this, data.control_epoch, {instancePath:instancePath+"/control_epoch",parentData:data,parentDataProperty:"control_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.effective_version !== undefined && func0.call(data, "effective_version")){
if(!(validate101.call(this, data.effective_version, {instancePath:instancePath+"/effective_version",parentData:data,parentDataProperty:"effective_version",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.effective_holder_id !== undefined && func0.call(data, "effective_holder_id")){
let data3 = data.effective_holder_id;
const _errs6 = errors;
let valid1 = false;
const _errs7 = errors;
if(!(validate93.call(this, data3, {instancePath:instancePath+"/effective_holder_id",parentData:data,parentDataProperty:"effective_holder_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
var _valid0 = _errs7 === errors;
valid1 = valid1 || _valid0;
const _errs8 = errors;
if(data3 !== null){
const err11 = {instancePath:instancePath+"/effective_holder_id",schemaPath:"#/properties/effective_holder_id/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
var _valid0 = _errs8 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err12 = {instancePath:instancePath+"/effective_holder_id",schemaPath:"#/properties/effective_holder_id/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
else {
errors = _errs6;
if(vErrors !== null){
if(_errs6){
vErrors.length = _errs6;
}
else {
vErrors = null;
}
}
}
}
if(data.mode !== undefined && func0.call(data, "mode")){
let data4 = data.mode;
if(!((data4 === "manual") || (data4 === "automatic"))){
const err13 = {instancePath:instancePath+"/mode",schemaPath:"#/properties/mode/enum",keyword:"enum",params:{allowedValues: schema83.properties.mode.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.gate_state !== undefined && func0.call(data, "gate_state")){
let data5 = data.gate_state;
if(!(((data5 === "ready") || (data5 === "fencing")) || (data5 === "protected"))){
const err14 = {instancePath:instancePath+"/gate_state",schemaPath:"#/properties/gate_state/enum",keyword:"enum",params:{allowedValues: schema83.properties.gate_state.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.pending_change !== undefined && func0.call(data, "pending_change")){
let data6 = data.pending_change;
const _errs13 = errors;
let valid2 = false;
const _errs14 = errors;
if(!(validate285.call(this, data6, {instancePath:instancePath+"/pending_change",parentData:data,parentDataProperty:"pending_change",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate285.errors : vErrors.concat(validate285.errors);
errors = vErrors.length;
}
var _valid1 = _errs14 === errors;
valid2 = valid2 || _valid1;
const _errs15 = errors;
if(data6 !== null){
const err15 = {instancePath:instancePath+"/pending_change",schemaPath:"#/properties/pending_change/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
var _valid1 = _errs15 === errors;
valid2 = valid2 || _valid1;
if(!valid2){
const err16 = {instancePath:instancePath+"/pending_change",schemaPath:"#/properties/pending_change/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
else {
errors = _errs13;
if(vErrors !== null){
if(_errs13){
vErrors.length = _errs13;
}
else {
vErrors = null;
}
}
}
}
if(data.transfers !== undefined && func0.call(data, "transfers")){
let data7 = data.transfers;
if(Array.isArray(data7)){
if(data7.length > 32){
const err17 = {instancePath:instancePath+"/transfers",schemaPath:"#/properties/transfers/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
const len0 = data7.length;
for(let i0=0; i0<len0; i0++){
if(!(validate291.call(this, data7[i0], {instancePath:instancePath+"/transfers/" + i0,parentData:data7,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate291.errors : vErrors.concat(validate291.errors);
errors = vErrors.length;
}
}
}
else {
const err18 = {instancePath:instancePath+"/transfers",schemaPath:"#/properties/transfers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.in_flight_commands !== undefined && func0.call(data, "in_flight_commands")){
let data9 = data.in_flight_commands;
if(Array.isArray(data9)){
if(data9.length > 256){
const err19 = {instancePath:instancePath+"/in_flight_commands",schemaPath:"#/properties/in_flight_commands/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
const len1 = data9.length;
for(let i1=0; i1<len1; i1++){
if(!(validate170.call(this, data9[i1], {instancePath:instancePath+"/in_flight_commands/" + i1,parentData:data9,parentDataProperty:i1,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
}
else {
const err20 = {instancePath:instancePath+"/in_flight_commands",schemaPath:"#/properties/in_flight_commands/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.unresolved_commands !== undefined && func0.call(data, "unresolved_commands")){
let data11 = data.unresolved_commands;
if(Array.isArray(data11)){
if(data11.length > 256){
const err21 = {instancePath:instancePath+"/unresolved_commands",schemaPath:"#/properties/unresolved_commands/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
const len2 = data11.length;
for(let i2=0; i2<len2; i2++){
if(!(validate170.call(this, data11[i2], {instancePath:instancePath+"/unresolved_commands/" + i2,parentData:data11,parentDataProperty:i2,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
}
else {
const err22 = {instancePath:instancePath+"/unresolved_commands",schemaPath:"#/properties/unresolved_commands/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
}
else {
const err23 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
validate280.errors = vErrors;
return errors === 0;
}
validate280.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema87 = {"type":"object","properties":{"device_ref":{"$ref":"#/$defs/snapshot__ObjectRef"},"source_key":{"$ref":"#/$defs/snapshot__SourceKey"},"provider_boot_id":{"$ref":"#/$defs/snapshot__Id"},"device_session_id":{"$ref":"#/$defs/snapshot__Id"},"observed_at":{"$ref":"#/$defs/snapshot__Timestamp"},"sampling_ref":{"anyOf":[{"$ref":"#/$defs/snapshot__ObjectRef"},{"type":"null"}]},"freshness_ms":{"anyOf":[{"type":"integer","minimum":0,"maximum":86400000,"xRawInteger":true},{"type":"null"}]},"quality":{"enum":["fresh","stale","unavailable"]},"integrity":{"enum":["complete","gap","unavailable"]},"values":{"$ref":"#/$defs/snapshot__QualifiedValue"}},"required":["device_ref","source_key","provider_boot_id","device_session_id","observed_at","sampling_ref","freshness_ms","quality","integrity","values"],"additionalProperties":false};
const schema88 = {"type":"object","properties":{"authority_service_id":{"$ref":"#/$defs/snapshot__Id"},"database_instance_id":{"$ref":"#/$defs/snapshot__Id"},"registration_id":{"$ref":"#/$defs/snapshot__Id"},"source_stream_id":{"$ref":"#/$defs/snapshot__Id"},"source_epoch":{"$ref":"#/$defs/snapshot__Id"}},"required":["authority_service_id","database_instance_id","registration_id","source_stream_id","source_epoch"],"additionalProperties":false};

function validate309(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate309.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.authority_service_id === undefined) || (!(func0.call(data, "authority_service_id")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "authority_service_id"},message:"must have required property '"+"authority_service_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.database_instance_id === undefined) || (!(func0.call(data, "database_instance_id")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "database_instance_id"},message:"must have required property '"+"database_instance_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.registration_id === undefined) || (!(func0.call(data, "registration_id")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "registration_id"},message:"must have required property '"+"registration_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.source_stream_id === undefined) || (!(func0.call(data, "source_stream_id")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_stream_id"},message:"must have required property '"+"source_stream_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.source_epoch === undefined) || (!(func0.call(data, "source_epoch")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_epoch"},message:"must have required property '"+"source_epoch"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(((((key0 === "authority_service_id") || (key0 === "database_instance_id")) || (key0 === "registration_id")) || (key0 === "source_stream_id")) || (key0 === "source_epoch"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.authority_service_id !== undefined && func0.call(data, "authority_service_id")){
if(!(validate93.call(this, data.authority_service_id, {instancePath:instancePath+"/authority_service_id",parentData:data,parentDataProperty:"authority_service_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.database_instance_id !== undefined && func0.call(data, "database_instance_id")){
if(!(validate93.call(this, data.database_instance_id, {instancePath:instancePath+"/database_instance_id",parentData:data,parentDataProperty:"database_instance_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.registration_id !== undefined && func0.call(data, "registration_id")){
if(!(validate93.call(this, data.registration_id, {instancePath:instancePath+"/registration_id",parentData:data,parentDataProperty:"registration_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.source_stream_id !== undefined && func0.call(data, "source_stream_id")){
if(!(validate93.call(this, data.source_stream_id, {instancePath:instancePath+"/source_stream_id",parentData:data,parentDataProperty:"source_stream_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.source_epoch !== undefined && func0.call(data, "source_epoch")){
if(!(validate93.call(this, data.source_epoch, {instancePath:instancePath+"/source_epoch",parentData:data,parentDataProperty:"source_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
}
else {
const err6 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
validate309.errors = vErrors;
return errors === 0;
}
validate309.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema89 = {"type":"object","properties":{"schema_ref":{"$ref":"#/$defs/snapshot__SchemaRef"},"value":{}},"required":["schema_ref","value"],"additionalProperties":false};
const schema90 = {"type":"object","properties":{"schema_id":{"type":"string","maxLength":256,"minLength":1},"definition":{"$ref":"#/$defs/snapshot__Id"},"schema_digest":{"$ref":"#/$defs/snapshot__Digest"}},"required":["schema_id","definition","schema_digest"],"additionalProperties":false};

function validate321(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate321.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.schema_id === undefined) || (!(func0.call(data, "schema_id")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "schema_id"},message:"must have required property '"+"schema_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.definition === undefined) || (!(func0.call(data, "definition")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "definition"},message:"must have required property '"+"definition"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.schema_digest === undefined) || (!(func0.call(data, "schema_digest")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "schema_digest"},message:"must have required property '"+"schema_digest"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(((key0 === "schema_id") || (key0 === "definition")) || (key0 === "schema_digest"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.schema_id !== undefined && func0.call(data, "schema_id")){
let data0 = data.schema_id;
if(typeof data0 === "string"){
if(func64(data0) > 256){
const err4 = {instancePath:instancePath+"/schema_id",schemaPath:"#/properties/schema_id/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(func64(data0) < 1){
const err5 = {instancePath:instancePath+"/schema_id",schemaPath:"#/properties/schema_id/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
else {
const err6 = {instancePath:instancePath+"/schema_id",schemaPath:"#/properties/schema_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.definition !== undefined && func0.call(data, "definition")){
if(!(validate93.call(this, data.definition, {instancePath:instancePath+"/definition",parentData:data,parentDataProperty:"definition",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.schema_digest !== undefined && func0.call(data, "schema_digest")){
if(!(validate99.call(this, data.schema_digest, {instancePath:instancePath+"/schema_digest",parentData:data,parentDataProperty:"schema_digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate99.errors : vErrors.concat(validate99.errors);
errors = vErrors.length;
}
}
}
else {
const err7 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
validate321.errors = vErrors;
return errors === 0;
}
validate321.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate320(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate320.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.schema_ref === undefined) || (!(func0.call(data, "schema_ref")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "schema_ref"},message:"must have required property '"+"schema_ref"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.value === undefined) || (!(func0.call(data, "value")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((key0 === "schema_ref") || (key0 === "value"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.schema_ref !== undefined && func0.call(data, "schema_ref")){
if(!(validate321.call(this, data.schema_ref, {instancePath:instancePath+"/schema_ref",parentData:data,parentDataProperty:"schema_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate321.errors : vErrors.concat(validate321.errors);
errors = vErrors.length;
}
}
}
else {
const err3 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
validate320.errors = vErrors;
return errors === 0;
}
validate320.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate307(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate307.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.device_ref === undefined) || (!(func0.call(data, "device_ref")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "device_ref"},message:"must have required property '"+"device_ref"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.source_key === undefined) || (!(func0.call(data, "source_key")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_key"},message:"must have required property '"+"source_key"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.provider_boot_id === undefined) || (!(func0.call(data, "provider_boot_id")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "provider_boot_id"},message:"must have required property '"+"provider_boot_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.device_session_id === undefined) || (!(func0.call(data, "device_session_id")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "device_session_id"},message:"must have required property '"+"device_session_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.observed_at === undefined) || (!(func0.call(data, "observed_at")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "observed_at"},message:"must have required property '"+"observed_at"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.sampling_ref === undefined) || (!(func0.call(data, "sampling_ref")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "sampling_ref"},message:"must have required property '"+"sampling_ref"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.freshness_ms === undefined) || (!(func0.call(data, "freshness_ms")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "freshness_ms"},message:"must have required property '"+"freshness_ms"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if((data.quality === undefined) || (!(func0.call(data, "quality")))){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "quality"},message:"must have required property '"+"quality"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if((data.integrity === undefined) || (!(func0.call(data, "integrity")))){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "integrity"},message:"must have required property '"+"integrity"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if((data.values === undefined) || (!(func0.call(data, "values")))){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "values"},message:"must have required property '"+"values"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(func0.call(schema87.properties, key0))){
const err10 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.device_ref !== undefined && func0.call(data, "device_ref")){
if(!(validate170.call(this, data.device_ref, {instancePath:instancePath+"/device_ref",parentData:data,parentDataProperty:"device_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
if(data.source_key !== undefined && func0.call(data, "source_key")){
if(!(validate309.call(this, data.source_key, {instancePath:instancePath+"/source_key",parentData:data,parentDataProperty:"source_key",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate309.errors : vErrors.concat(validate309.errors);
errors = vErrors.length;
}
}
if(data.provider_boot_id !== undefined && func0.call(data, "provider_boot_id")){
if(!(validate93.call(this, data.provider_boot_id, {instancePath:instancePath+"/provider_boot_id",parentData:data,parentDataProperty:"provider_boot_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.device_session_id !== undefined && func0.call(data, "device_session_id")){
if(!(validate93.call(this, data.device_session_id, {instancePath:instancePath+"/device_session_id",parentData:data,parentDataProperty:"device_session_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.observed_at !== undefined && func0.call(data, "observed_at")){
if(!(validate297.call(this, data.observed_at, {instancePath:instancePath+"/observed_at",parentData:data,parentDataProperty:"observed_at",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate297.errors : vErrors.concat(validate297.errors);
errors = vErrors.length;
}
}
if(data.sampling_ref !== undefined && func0.call(data, "sampling_ref")){
let data5 = data.sampling_ref;
const _errs8 = errors;
let valid1 = false;
const _errs9 = errors;
if(!(validate170.call(this, data5, {instancePath:instancePath+"/sampling_ref",parentData:data,parentDataProperty:"sampling_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
var _valid0 = _errs9 === errors;
valid1 = valid1 || _valid0;
const _errs10 = errors;
if(data5 !== null){
const err11 = {instancePath:instancePath+"/sampling_ref",schemaPath:"#/properties/sampling_ref/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
var _valid0 = _errs10 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err12 = {instancePath:instancePath+"/sampling_ref",schemaPath:"#/properties/sampling_ref/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
else {
errors = _errs8;
if(vErrors !== null){
if(_errs8){
vErrors.length = _errs8;
}
else {
vErrors = null;
}
}
}
}
if(data.freshness_ms !== undefined && func0.call(data, "freshness_ms")){
let data6 = data.freshness_ms;
const _errs13 = errors;
let valid2 = false;
const _errs14 = errors;
if(!((typeof data6 == "number") && (!(data6 % 1) && !isNaN(data6)))){
const err13 = {instancePath:instancePath+"/freshness_ms",schemaPath:"#/properties/freshness_ms/anyOf/0/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(typeof data6 == "number"){
if(data6 > 86400000 || isNaN(data6)){
const err14 = {instancePath:instancePath+"/freshness_ms",schemaPath:"#/properties/freshness_ms/anyOf/0/maximum",keyword:"maximum",params:{comparison: "<=", limit: 86400000},message:"must be <= 86400000"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data6 < 0 || isNaN(data6)){
const err15 = {instancePath:instancePath+"/freshness_ms",schemaPath:"#/properties/freshness_ms/anyOf/0/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
const rawToken0 = this && this.numbers && this.numbers.get(instancePath + "/freshness_ms");
if(!rawToken0 || !rawToken0.integer || !rawToken0.safe){
const err16 = {instancePath:instancePath+"/freshness_ms",schemaPath:"#/properties/freshness_ms/anyOf/0/xRawInteger",keyword:"xRawInteger",params:{},message:"must pass \"xRawInteger\" keyword validation"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
var _valid1 = _errs14 === errors;
valid2 = valid2 || _valid1;
const _errs16 = errors;
if(data6 !== null){
const err17 = {instancePath:instancePath+"/freshness_ms",schemaPath:"#/properties/freshness_ms/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
var _valid1 = _errs16 === errors;
valid2 = valid2 || _valid1;
if(!valid2){
const err18 = {instancePath:instancePath+"/freshness_ms",schemaPath:"#/properties/freshness_ms/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
else {
errors = _errs13;
if(vErrors !== null){
if(_errs13){
vErrors.length = _errs13;
}
else {
vErrors = null;
}
}
}
}
if(data.quality !== undefined && func0.call(data, "quality")){
let data7 = data.quality;
if(!(((data7 === "fresh") || (data7 === "stale")) || (data7 === "unavailable"))){
const err19 = {instancePath:instancePath+"/quality",schemaPath:"#/properties/quality/enum",keyword:"enum",params:{allowedValues: schema87.properties.quality.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.integrity !== undefined && func0.call(data, "integrity")){
let data8 = data.integrity;
if(!(((data8 === "complete") || (data8 === "gap")) || (data8 === "unavailable"))){
const err20 = {instancePath:instancePath+"/integrity",schemaPath:"#/properties/integrity/enum",keyword:"enum",params:{allowedValues: schema87.properties.integrity.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.values !== undefined && func0.call(data, "values")){
if(!(validate320.call(this, data.values, {instancePath:instancePath+"/values",parentData:data,parentDataProperty:"values",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate320.errors : vErrors.concat(validate320.errors);
errors = vErrors.length;
}
}
}
else {
const err21 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
validate307.errors = vErrors;
return errors === 0;
}
validate307.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema91 = {"type":"object","properties":{"source_key":{"$ref":"#/$defs/snapshot__SourceKey"},"binding_ref":{"$ref":"#/$defs/snapshot__ObjectRef"},"state":{"enum":["baseline_required","synchronized","desynchronized","quarantined","closed"]},"contiguous_sequence":{"$ref":"#/$defs/snapshot__Counter"},"highest_seen_sequence":{"$ref":"#/$defs/snapshot__Counter"},"baseline_ref":{"anyOf":[{"$ref":"#/$defs/snapshot__ObjectRef"},{"type":"null"}]},"gaps":{"type":"array","items":{"$ref":"#/$defs/snapshot__Gap"},"maxItems":64}},"required":["source_key","binding_ref","state","contiguous_sequence","highest_seen_sequence","baseline_ref","gaps"],"additionalProperties":false};
const schema92 = {"type":"object","properties":{"gap_id":{"$ref":"#/$defs/snapshot__Id"},"loss_extent":{"enum":["known","unknown"]},"first_missing":{"anyOf":[{"$ref":"#/$defs/snapshot__Counter"},{"type":"null"}]},"last_missing":{"anyOf":[{"$ref":"#/$defs/snapshot__Counter"},{"type":"null"}]},"resolution_state":{"enum":["open","acknowledged","baseline_replaced"]}},"required":["gap_id","loss_extent","first_missing","last_missing","resolution_state"],"additionalProperties":false};

function validate336(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate336.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.gap_id === undefined) || (!(func0.call(data, "gap_id")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "gap_id"},message:"must have required property '"+"gap_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.loss_extent === undefined) || (!(func0.call(data, "loss_extent")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "loss_extent"},message:"must have required property '"+"loss_extent"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.first_missing === undefined) || (!(func0.call(data, "first_missing")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "first_missing"},message:"must have required property '"+"first_missing"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.last_missing === undefined) || (!(func0.call(data, "last_missing")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "last_missing"},message:"must have required property '"+"last_missing"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.resolution_state === undefined) || (!(func0.call(data, "resolution_state")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "resolution_state"},message:"must have required property '"+"resolution_state"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(((((key0 === "gap_id") || (key0 === "loss_extent")) || (key0 === "first_missing")) || (key0 === "last_missing")) || (key0 === "resolution_state"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.gap_id !== undefined && func0.call(data, "gap_id")){
if(!(validate93.call(this, data.gap_id, {instancePath:instancePath+"/gap_id",parentData:data,parentDataProperty:"gap_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.loss_extent !== undefined && func0.call(data, "loss_extent")){
let data1 = data.loss_extent;
if(!((data1 === "known") || (data1 === "unknown"))){
const err6 = {instancePath:instancePath+"/loss_extent",schemaPath:"#/properties/loss_extent/enum",keyword:"enum",params:{allowedValues: schema92.properties.loss_extent.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.first_missing !== undefined && func0.call(data, "first_missing")){
let data2 = data.first_missing;
const _errs5 = errors;
let valid1 = false;
const _errs6 = errors;
if(!(validate101.call(this, data2, {instancePath:instancePath+"/first_missing",parentData:data,parentDataProperty:"first_missing",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
var _valid0 = _errs6 === errors;
valid1 = valid1 || _valid0;
const _errs7 = errors;
if(data2 !== null){
const err7 = {instancePath:instancePath+"/first_missing",schemaPath:"#/properties/first_missing/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
var _valid0 = _errs7 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err8 = {instancePath:instancePath+"/first_missing",schemaPath:"#/properties/first_missing/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
else {
errors = _errs5;
if(vErrors !== null){
if(_errs5){
vErrors.length = _errs5;
}
else {
vErrors = null;
}
}
}
}
if(data.last_missing !== undefined && func0.call(data, "last_missing")){
let data3 = data.last_missing;
const _errs10 = errors;
let valid2 = false;
const _errs11 = errors;
if(!(validate101.call(this, data3, {instancePath:instancePath+"/last_missing",parentData:data,parentDataProperty:"last_missing",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
var _valid1 = _errs11 === errors;
valid2 = valid2 || _valid1;
const _errs12 = errors;
if(data3 !== null){
const err9 = {instancePath:instancePath+"/last_missing",schemaPath:"#/properties/last_missing/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
var _valid1 = _errs12 === errors;
valid2 = valid2 || _valid1;
if(!valid2){
const err10 = {instancePath:instancePath+"/last_missing",schemaPath:"#/properties/last_missing/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
else {
errors = _errs10;
if(vErrors !== null){
if(_errs10){
vErrors.length = _errs10;
}
else {
vErrors = null;
}
}
}
}
if(data.resolution_state !== undefined && func0.call(data, "resolution_state")){
let data4 = data.resolution_state;
if(!(((data4 === "open") || (data4 === "acknowledged")) || (data4 === "baseline_replaced"))){
const err11 = {instancePath:instancePath+"/resolution_state",schemaPath:"#/properties/resolution_state/enum",keyword:"enum",params:{allowedValues: schema92.properties.resolution_state.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
else {
const err12 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
validate336.errors = vErrors;
return errors === 0;
}
validate336.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate330(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate330.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.source_key === undefined) || (!(func0.call(data, "source_key")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_key"},message:"must have required property '"+"source_key"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.binding_ref === undefined) || (!(func0.call(data, "binding_ref")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "binding_ref"},message:"must have required property '"+"binding_ref"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.state === undefined) || (!(func0.call(data, "state")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "state"},message:"must have required property '"+"state"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.contiguous_sequence === undefined) || (!(func0.call(data, "contiguous_sequence")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "contiguous_sequence"},message:"must have required property '"+"contiguous_sequence"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.highest_seen_sequence === undefined) || (!(func0.call(data, "highest_seen_sequence")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "highest_seen_sequence"},message:"must have required property '"+"highest_seen_sequence"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.baseline_ref === undefined) || (!(func0.call(data, "baseline_ref")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "baseline_ref"},message:"must have required property '"+"baseline_ref"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.gaps === undefined) || (!(func0.call(data, "gaps")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "gaps"},message:"must have required property '"+"gaps"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(((((((key0 === "source_key") || (key0 === "binding_ref")) || (key0 === "state")) || (key0 === "contiguous_sequence")) || (key0 === "highest_seen_sequence")) || (key0 === "baseline_ref")) || (key0 === "gaps"))){
const err7 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.source_key !== undefined && func0.call(data, "source_key")){
if(!(validate309.call(this, data.source_key, {instancePath:instancePath+"/source_key",parentData:data,parentDataProperty:"source_key",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate309.errors : vErrors.concat(validate309.errors);
errors = vErrors.length;
}
}
if(data.binding_ref !== undefined && func0.call(data, "binding_ref")){
if(!(validate170.call(this, data.binding_ref, {instancePath:instancePath+"/binding_ref",parentData:data,parentDataProperty:"binding_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
if(data.state !== undefined && func0.call(data, "state")){
let data2 = data.state;
if(!(((((data2 === "baseline_required") || (data2 === "synchronized")) || (data2 === "desynchronized")) || (data2 === "quarantined")) || (data2 === "closed"))){
const err8 = {instancePath:instancePath+"/state",schemaPath:"#/properties/state/enum",keyword:"enum",params:{allowedValues: schema91.properties.state.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.contiguous_sequence !== undefined && func0.call(data, "contiguous_sequence")){
if(!(validate101.call(this, data.contiguous_sequence, {instancePath:instancePath+"/contiguous_sequence",parentData:data,parentDataProperty:"contiguous_sequence",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.highest_seen_sequence !== undefined && func0.call(data, "highest_seen_sequence")){
if(!(validate101.call(this, data.highest_seen_sequence, {instancePath:instancePath+"/highest_seen_sequence",parentData:data,parentDataProperty:"highest_seen_sequence",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.baseline_ref !== undefined && func0.call(data, "baseline_ref")){
let data5 = data.baseline_ref;
const _errs8 = errors;
let valid1 = false;
const _errs9 = errors;
if(!(validate170.call(this, data5, {instancePath:instancePath+"/baseline_ref",parentData:data,parentDataProperty:"baseline_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
var _valid0 = _errs9 === errors;
valid1 = valid1 || _valid0;
const _errs10 = errors;
if(data5 !== null){
const err9 = {instancePath:instancePath+"/baseline_ref",schemaPath:"#/properties/baseline_ref/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
var _valid0 = _errs10 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err10 = {instancePath:instancePath+"/baseline_ref",schemaPath:"#/properties/baseline_ref/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
else {
errors = _errs8;
if(vErrors !== null){
if(_errs8){
vErrors.length = _errs8;
}
else {
vErrors = null;
}
}
}
}
if(data.gaps !== undefined && func0.call(data, "gaps")){
let data6 = data.gaps;
if(Array.isArray(data6)){
if(data6.length > 64){
const err11 = {instancePath:instancePath+"/gaps",schemaPath:"#/properties/gaps/maxItems",keyword:"maxItems",params:{limit: 64},message:"must NOT have more than 64 items"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
const len0 = data6.length;
for(let i0=0; i0<len0; i0++){
if(!(validate336.call(this, data6[i0], {instancePath:instancePath+"/gaps/" + i0,parentData:data6,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate336.errors : vErrors.concat(validate336.errors);
errors = vErrors.length;
}
}
}
else {
const err12 = {instancePath:instancePath+"/gaps",schemaPath:"#/properties/gaps/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
}
else {
const err13 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
validate330.errors = vErrors;
return errors === 0;
}
validate330.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema93 = {"type":"object","properties":{"display_name":{"type":"string","maxLength":1024},"published_ref":{"anyOf":[{"$ref":"#/$defs/snapshot__ObjectRef"},{"type":"null"}]},"draft_revision":{"anyOf":[{"$ref":"#/$defs/snapshot__Counter"},{"type":"null"}]},"activation_state":{"enum":["inactive","active","retired"]}},"required":["display_name","published_ref","draft_revision","activation_state"],"additionalProperties":false};

function validate345(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate345.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.display_name === undefined) || (!(func0.call(data, "display_name")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "display_name"},message:"must have required property '"+"display_name"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.published_ref === undefined) || (!(func0.call(data, "published_ref")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "published_ref"},message:"must have required property '"+"published_ref"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.draft_revision === undefined) || (!(func0.call(data, "draft_revision")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "draft_revision"},message:"must have required property '"+"draft_revision"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.activation_state === undefined) || (!(func0.call(data, "activation_state")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "activation_state"},message:"must have required property '"+"activation_state"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((((key0 === "display_name") || (key0 === "published_ref")) || (key0 === "draft_revision")) || (key0 === "activation_state"))){
const err4 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.display_name !== undefined && func0.call(data, "display_name")){
let data0 = data.display_name;
if(typeof data0 === "string"){
if(func64(data0) > 1024){
const err5 = {instancePath:instancePath+"/display_name",schemaPath:"#/properties/display_name/maxLength",keyword:"maxLength",params:{limit: 1024},message:"must NOT have more than 1024 characters"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
else {
const err6 = {instancePath:instancePath+"/display_name",schemaPath:"#/properties/display_name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.published_ref !== undefined && func0.call(data, "published_ref")){
let data1 = data.published_ref;
const _errs5 = errors;
let valid1 = false;
const _errs6 = errors;
if(!(validate170.call(this, data1, {instancePath:instancePath+"/published_ref",parentData:data,parentDataProperty:"published_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
var _valid0 = _errs6 === errors;
valid1 = valid1 || _valid0;
const _errs7 = errors;
if(data1 !== null){
const err7 = {instancePath:instancePath+"/published_ref",schemaPath:"#/properties/published_ref/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
var _valid0 = _errs7 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err8 = {instancePath:instancePath+"/published_ref",schemaPath:"#/properties/published_ref/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
else {
errors = _errs5;
if(vErrors !== null){
if(_errs5){
vErrors.length = _errs5;
}
else {
vErrors = null;
}
}
}
}
if(data.draft_revision !== undefined && func0.call(data, "draft_revision")){
let data2 = data.draft_revision;
const _errs10 = errors;
let valid2 = false;
const _errs11 = errors;
if(!(validate101.call(this, data2, {instancePath:instancePath+"/draft_revision",parentData:data,parentDataProperty:"draft_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
var _valid1 = _errs11 === errors;
valid2 = valid2 || _valid1;
const _errs12 = errors;
if(data2 !== null){
const err9 = {instancePath:instancePath+"/draft_revision",schemaPath:"#/properties/draft_revision/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
var _valid1 = _errs12 === errors;
valid2 = valid2 || _valid1;
if(!valid2){
const err10 = {instancePath:instancePath+"/draft_revision",schemaPath:"#/properties/draft_revision/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
else {
errors = _errs10;
if(vErrors !== null){
if(_errs10){
vErrors.length = _errs10;
}
else {
vErrors = null;
}
}
}
}
if(data.activation_state !== undefined && func0.call(data, "activation_state")){
let data3 = data.activation_state;
if(!(((data3 === "inactive") || (data3 === "active")) || (data3 === "retired"))){
const err11 = {instancePath:instancePath+"/activation_state",schemaPath:"#/properties/activation_state/enum",keyword:"enum",params:{allowedValues: schema93.properties.activation_state.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
else {
const err12 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
validate345.errors = vErrors;
return errors === 0;
}
validate345.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema94 = {"type":"object","properties":{"definition_ref":{"$ref":"#/$defs/snapshot__ObjectRef"},"business_state_ref":{"anyOf":[{"$ref":"#/$defs/snapshot__ObjectRef"},{"type":"null"}]},"arm_generation":{"$ref":"#/$defs/snapshot__Counter"},"lifecycle":{"enum":["disarmed","armed","running","paused","completed"]},"execution_summary":{"enum":["pending","succeeded","completed_with_failures","failed","unknown","blocked"]},"active_execution_ref":{"anyOf":[{"$ref":"#/$defs/snapshot__ObjectRef"},{"type":"null"}]},"pause_reasons":{"type":"array","items":{"$ref":"#/$defs/snapshot__Id"},"maxItems":64},"authorization_state":{"enum":["valid","pending","revoked","expired","unavailable"]},"recovery":{"anyOf":[{"$ref":"#/$defs/snapshot__Recovery"},{"type":"null"}]}},"required":["definition_ref","business_state_ref","arm_generation","lifecycle","execution_summary","active_execution_ref","pause_reasons","authorization_state","recovery"],"additionalProperties":false};
const schema95 = {"type":"object","properties":{"operation_ref":{"$ref":"#/$defs/snapshot__ObjectRef"},"state":{"enum":["reserved","preparing","ready","running","completed","paused","indeterminate"]},"recovery_generation":{"$ref":"#/$defs/snapshot__Counter"},"new_execution_ref":{"$ref":"#/$defs/snapshot__ObjectRef"},"consumed":{"const":true}},"required":["operation_ref","state","recovery_generation","new_execution_ref","consumed"],"additionalProperties":false};

function validate358(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate358.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.operation_ref === undefined) || (!(func0.call(data, "operation_ref")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "operation_ref"},message:"must have required property '"+"operation_ref"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.state === undefined) || (!(func0.call(data, "state")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "state"},message:"must have required property '"+"state"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.recovery_generation === undefined) || (!(func0.call(data, "recovery_generation")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "recovery_generation"},message:"must have required property '"+"recovery_generation"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.new_execution_ref === undefined) || (!(func0.call(data, "new_execution_ref")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "new_execution_ref"},message:"must have required property '"+"new_execution_ref"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.consumed === undefined) || (!(func0.call(data, "consumed")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "consumed"},message:"must have required property '"+"consumed"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(((((key0 === "operation_ref") || (key0 === "state")) || (key0 === "recovery_generation")) || (key0 === "new_execution_ref")) || (key0 === "consumed"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.operation_ref !== undefined && func0.call(data, "operation_ref")){
if(!(validate170.call(this, data.operation_ref, {instancePath:instancePath+"/operation_ref",parentData:data,parentDataProperty:"operation_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
if(data.state !== undefined && func0.call(data, "state")){
let data1 = data.state;
if(!(((((((data1 === "reserved") || (data1 === "preparing")) || (data1 === "ready")) || (data1 === "running")) || (data1 === "completed")) || (data1 === "paused")) || (data1 === "indeterminate"))){
const err6 = {instancePath:instancePath+"/state",schemaPath:"#/properties/state/enum",keyword:"enum",params:{allowedValues: schema95.properties.state.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.recovery_generation !== undefined && func0.call(data, "recovery_generation")){
if(!(validate101.call(this, data.recovery_generation, {instancePath:instancePath+"/recovery_generation",parentData:data,parentDataProperty:"recovery_generation",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.new_execution_ref !== undefined && func0.call(data, "new_execution_ref")){
if(!(validate170.call(this, data.new_execution_ref, {instancePath:instancePath+"/new_execution_ref",parentData:data,parentDataProperty:"new_execution_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
if(data.consumed !== undefined && func0.call(data, "consumed")){
if(true !== data.consumed){
const err7 = {instancePath:instancePath+"/consumed",schemaPath:"#/properties/consumed/const",keyword:"const",params:{allowedValue: true},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
else {
const err8 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
validate358.errors = vErrors;
return errors === 0;
}
validate358.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate352(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate352.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.definition_ref === undefined) || (!(func0.call(data, "definition_ref")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "definition_ref"},message:"must have required property '"+"definition_ref"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.business_state_ref === undefined) || (!(func0.call(data, "business_state_ref")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "business_state_ref"},message:"must have required property '"+"business_state_ref"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.arm_generation === undefined) || (!(func0.call(data, "arm_generation")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "arm_generation"},message:"must have required property '"+"arm_generation"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.lifecycle === undefined) || (!(func0.call(data, "lifecycle")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "lifecycle"},message:"must have required property '"+"lifecycle"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.execution_summary === undefined) || (!(func0.call(data, "execution_summary")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "execution_summary"},message:"must have required property '"+"execution_summary"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.active_execution_ref === undefined) || (!(func0.call(data, "active_execution_ref")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "active_execution_ref"},message:"must have required property '"+"active_execution_ref"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.pause_reasons === undefined) || (!(func0.call(data, "pause_reasons")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "pause_reasons"},message:"must have required property '"+"pause_reasons"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if((data.authorization_state === undefined) || (!(func0.call(data, "authorization_state")))){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "authorization_state"},message:"must have required property '"+"authorization_state"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if((data.recovery === undefined) || (!(func0.call(data, "recovery")))){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "recovery"},message:"must have required property '"+"recovery"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(func0.call(schema94.properties, key0))){
const err9 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.definition_ref !== undefined && func0.call(data, "definition_ref")){
if(!(validate170.call(this, data.definition_ref, {instancePath:instancePath+"/definition_ref",parentData:data,parentDataProperty:"definition_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
if(data.business_state_ref !== undefined && func0.call(data, "business_state_ref")){
let data1 = data.business_state_ref;
const _errs4 = errors;
let valid1 = false;
const _errs5 = errors;
if(!(validate170.call(this, data1, {instancePath:instancePath+"/business_state_ref",parentData:data,parentDataProperty:"business_state_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
var _valid0 = _errs5 === errors;
valid1 = valid1 || _valid0;
const _errs6 = errors;
if(data1 !== null){
const err10 = {instancePath:instancePath+"/business_state_ref",schemaPath:"#/properties/business_state_ref/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
var _valid0 = _errs6 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err11 = {instancePath:instancePath+"/business_state_ref",schemaPath:"#/properties/business_state_ref/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
else {
errors = _errs4;
if(vErrors !== null){
if(_errs4){
vErrors.length = _errs4;
}
else {
vErrors = null;
}
}
}
}
if(data.arm_generation !== undefined && func0.call(data, "arm_generation")){
if(!(validate101.call(this, data.arm_generation, {instancePath:instancePath+"/arm_generation",parentData:data,parentDataProperty:"arm_generation",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.lifecycle !== undefined && func0.call(data, "lifecycle")){
let data3 = data.lifecycle;
if(!(((((data3 === "disarmed") || (data3 === "armed")) || (data3 === "running")) || (data3 === "paused")) || (data3 === "completed"))){
const err12 = {instancePath:instancePath+"/lifecycle",schemaPath:"#/properties/lifecycle/enum",keyword:"enum",params:{allowedValues: schema94.properties.lifecycle.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.execution_summary !== undefined && func0.call(data, "execution_summary")){
let data4 = data.execution_summary;
if(!((((((data4 === "pending") || (data4 === "succeeded")) || (data4 === "completed_with_failures")) || (data4 === "failed")) || (data4 === "unknown")) || (data4 === "blocked"))){
const err13 = {instancePath:instancePath+"/execution_summary",schemaPath:"#/properties/execution_summary/enum",keyword:"enum",params:{allowedValues: schema94.properties.execution_summary.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.active_execution_ref !== undefined && func0.call(data, "active_execution_ref")){
let data5 = data.active_execution_ref;
const _errs12 = errors;
let valid2 = false;
const _errs13 = errors;
if(!(validate170.call(this, data5, {instancePath:instancePath+"/active_execution_ref",parentData:data,parentDataProperty:"active_execution_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
var _valid1 = _errs13 === errors;
valid2 = valid2 || _valid1;
const _errs14 = errors;
if(data5 !== null){
const err14 = {instancePath:instancePath+"/active_execution_ref",schemaPath:"#/properties/active_execution_ref/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
var _valid1 = _errs14 === errors;
valid2 = valid2 || _valid1;
if(!valid2){
const err15 = {instancePath:instancePath+"/active_execution_ref",schemaPath:"#/properties/active_execution_ref/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
else {
errors = _errs12;
if(vErrors !== null){
if(_errs12){
vErrors.length = _errs12;
}
else {
vErrors = null;
}
}
}
}
if(data.pause_reasons !== undefined && func0.call(data, "pause_reasons")){
let data6 = data.pause_reasons;
if(Array.isArray(data6)){
if(data6.length > 64){
const err16 = {instancePath:instancePath+"/pause_reasons",schemaPath:"#/properties/pause_reasons/maxItems",keyword:"maxItems",params:{limit: 64},message:"must NOT have more than 64 items"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
const len0 = data6.length;
for(let i0=0; i0<len0; i0++){
if(!(validate93.call(this, data6[i0], {instancePath:instancePath+"/pause_reasons/" + i0,parentData:data6,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
}
else {
const err17 = {instancePath:instancePath+"/pause_reasons",schemaPath:"#/properties/pause_reasons/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
if(data.authorization_state !== undefined && func0.call(data, "authorization_state")){
let data8 = data.authorization_state;
if(!(((((data8 === "valid") || (data8 === "pending")) || (data8 === "revoked")) || (data8 === "expired")) || (data8 === "unavailable"))){
const err18 = {instancePath:instancePath+"/authorization_state",schemaPath:"#/properties/authorization_state/enum",keyword:"enum",params:{allowedValues: schema94.properties.authorization_state.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.recovery !== undefined && func0.call(data, "recovery")){
let data9 = data.recovery;
const _errs21 = errors;
let valid5 = false;
const _errs22 = errors;
if(!(validate358.call(this, data9, {instancePath:instancePath+"/recovery",parentData:data,parentDataProperty:"recovery",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate358.errors : vErrors.concat(validate358.errors);
errors = vErrors.length;
}
var _valid2 = _errs22 === errors;
valid5 = valid5 || _valid2;
const _errs23 = errors;
if(data9 !== null){
const err19 = {instancePath:instancePath+"/recovery",schemaPath:"#/properties/recovery/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
var _valid2 = _errs23 === errors;
valid5 = valid5 || _valid2;
if(!valid5){
const err20 = {instancePath:instancePath+"/recovery",schemaPath:"#/properties/recovery/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
else {
errors = _errs21;
if(vErrors !== null){
if(_errs21){
vErrors.length = _errs21;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err21 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
validate352.errors = vErrors;
return errors === 0;
}
validate352.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema96 = {"type":"object","properties":{"run_ref":{"$ref":"#/$defs/snapshot__ObjectRef"},"state_id":{"anyOf":[{"$ref":"#/$defs/snapshot__Id"},{"type":"null"}]},"last_transition_ref":{"anyOf":[{"$ref":"#/$defs/snapshot__ObjectRef"},{"type":"null"}]},"active_execution_ref":{"anyOf":[{"$ref":"#/$defs/snapshot__ObjectRef"},{"type":"null"}]}},"required":["run_ref","state_id","last_transition_ref","active_execution_ref"],"additionalProperties":false};

function validate367(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate367.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.run_ref === undefined) || (!(func0.call(data, "run_ref")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "run_ref"},message:"must have required property '"+"run_ref"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.state_id === undefined) || (!(func0.call(data, "state_id")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "state_id"},message:"must have required property '"+"state_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.last_transition_ref === undefined) || (!(func0.call(data, "last_transition_ref")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "last_transition_ref"},message:"must have required property '"+"last_transition_ref"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.active_execution_ref === undefined) || (!(func0.call(data, "active_execution_ref")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "active_execution_ref"},message:"must have required property '"+"active_execution_ref"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((((key0 === "run_ref") || (key0 === "state_id")) || (key0 === "last_transition_ref")) || (key0 === "active_execution_ref"))){
const err4 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.run_ref !== undefined && func0.call(data, "run_ref")){
if(!(validate170.call(this, data.run_ref, {instancePath:instancePath+"/run_ref",parentData:data,parentDataProperty:"run_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
if(data.state_id !== undefined && func0.call(data, "state_id")){
let data1 = data.state_id;
const _errs4 = errors;
let valid1 = false;
const _errs5 = errors;
if(!(validate93.call(this, data1, {instancePath:instancePath+"/state_id",parentData:data,parentDataProperty:"state_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
var _valid0 = _errs5 === errors;
valid1 = valid1 || _valid0;
const _errs6 = errors;
if(data1 !== null){
const err5 = {instancePath:instancePath+"/state_id",schemaPath:"#/properties/state_id/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
var _valid0 = _errs6 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err6 = {instancePath:instancePath+"/state_id",schemaPath:"#/properties/state_id/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
else {
errors = _errs4;
if(vErrors !== null){
if(_errs4){
vErrors.length = _errs4;
}
else {
vErrors = null;
}
}
}
}
if(data.last_transition_ref !== undefined && func0.call(data, "last_transition_ref")){
let data2 = data.last_transition_ref;
const _errs9 = errors;
let valid2 = false;
const _errs10 = errors;
if(!(validate170.call(this, data2, {instancePath:instancePath+"/last_transition_ref",parentData:data,parentDataProperty:"last_transition_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
var _valid1 = _errs10 === errors;
valid2 = valid2 || _valid1;
const _errs11 = errors;
if(data2 !== null){
const err7 = {instancePath:instancePath+"/last_transition_ref",schemaPath:"#/properties/last_transition_ref/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
var _valid1 = _errs11 === errors;
valid2 = valid2 || _valid1;
if(!valid2){
const err8 = {instancePath:instancePath+"/last_transition_ref",schemaPath:"#/properties/last_transition_ref/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
else {
errors = _errs9;
if(vErrors !== null){
if(_errs9){
vErrors.length = _errs9;
}
else {
vErrors = null;
}
}
}
}
if(data.active_execution_ref !== undefined && func0.call(data, "active_execution_ref")){
let data3 = data.active_execution_ref;
const _errs14 = errors;
let valid3 = false;
const _errs15 = errors;
if(!(validate170.call(this, data3, {instancePath:instancePath+"/active_execution_ref",parentData:data,parentDataProperty:"active_execution_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
var _valid2 = _errs15 === errors;
valid3 = valid3 || _valid2;
const _errs16 = errors;
if(data3 !== null){
const err9 = {instancePath:instancePath+"/active_execution_ref",schemaPath:"#/properties/active_execution_ref/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
var _valid2 = _errs16 === errors;
valid3 = valid3 || _valid2;
if(!valid3){
const err10 = {instancePath:instancePath+"/active_execution_ref",schemaPath:"#/properties/active_execution_ref/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
else {
errors = _errs14;
if(vErrors !== null){
if(_errs14){
vErrors.length = _errs14;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err11 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
validate367.errors = vErrors;
return errors === 0;
}
validate367.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema97 = {"type":"object","properties":{"run_ref":{"$ref":"#/$defs/snapshot__ObjectRef"},"plan_ref":{"$ref":"#/$defs/snapshot__ObjectRef"},"generation":{"$ref":"#/$defs/snapshot__Counter"},"state":{"enum":["pending","running","paused","succeeded","completed_with_failures","failed","unknown","blocked","cancelled"]},"steps":{"type":"array","items":{"$ref":"#/$defs/snapshot__Step"},"maxItems":256},"source_execution_ref":{"anyOf":[{"$ref":"#/$defs/snapshot__ObjectRef"},{"type":"null"}]}},"required":["run_ref","plan_ref","generation","state","steps","source_execution_ref"],"additionalProperties":false};
const schema98 = {"type":"object","properties":{"step_id":{"$ref":"#/$defs/snapshot__Id"},"required":{"type":"boolean"},"state":{"enum":["pending","running","succeeded","failed","unknown","blocked","cancelled"]},"command_ref":{"anyOf":[{"$ref":"#/$defs/snapshot__ObjectRef"},{"type":"null"}]},"evidence_refs":{"type":"array","items":{"$ref":"#/$defs/snapshot__ObjectRef"},"maxItems":256}},"required":["step_id","required","state","command_ref","evidence_refs"],"additionalProperties":false};

function validate380(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate380.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.step_id === undefined) || (!(func0.call(data, "step_id")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "step_id"},message:"must have required property '"+"step_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.required === undefined) || (!(func0.call(data, "required")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "required"},message:"must have required property '"+"required"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.state === undefined) || (!(func0.call(data, "state")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "state"},message:"must have required property '"+"state"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.command_ref === undefined) || (!(func0.call(data, "command_ref")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "command_ref"},message:"must have required property '"+"command_ref"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.evidence_refs === undefined) || (!(func0.call(data, "evidence_refs")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "evidence_refs"},message:"must have required property '"+"evidence_refs"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(((((key0 === "step_id") || (key0 === "required")) || (key0 === "state")) || (key0 === "command_ref")) || (key0 === "evidence_refs"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.step_id !== undefined && func0.call(data, "step_id")){
if(!(validate93.call(this, data.step_id, {instancePath:instancePath+"/step_id",parentData:data,parentDataProperty:"step_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.required !== undefined && func0.call(data, "required")){
if(typeof data.required !== "boolean"){
const err6 = {instancePath:instancePath+"/required",schemaPath:"#/properties/required/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.state !== undefined && func0.call(data, "state")){
let data2 = data.state;
if(!(((((((data2 === "pending") || (data2 === "running")) || (data2 === "succeeded")) || (data2 === "failed")) || (data2 === "unknown")) || (data2 === "blocked")) || (data2 === "cancelled"))){
const err7 = {instancePath:instancePath+"/state",schemaPath:"#/properties/state/enum",keyword:"enum",params:{allowedValues: schema98.properties.state.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.command_ref !== undefined && func0.call(data, "command_ref")){
let data3 = data.command_ref;
const _errs7 = errors;
let valid1 = false;
const _errs8 = errors;
if(!(validate170.call(this, data3, {instancePath:instancePath+"/command_ref",parentData:data,parentDataProperty:"command_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
var _valid0 = _errs8 === errors;
valid1 = valid1 || _valid0;
const _errs9 = errors;
if(data3 !== null){
const err8 = {instancePath:instancePath+"/command_ref",schemaPath:"#/properties/command_ref/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
var _valid0 = _errs9 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err9 = {instancePath:instancePath+"/command_ref",schemaPath:"#/properties/command_ref/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
else {
errors = _errs7;
if(vErrors !== null){
if(_errs7){
vErrors.length = _errs7;
}
else {
vErrors = null;
}
}
}
}
if(data.evidence_refs !== undefined && func0.call(data, "evidence_refs")){
let data4 = data.evidence_refs;
if(Array.isArray(data4)){
if(data4.length > 256){
const err10 = {instancePath:instancePath+"/evidence_refs",schemaPath:"#/properties/evidence_refs/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
const len0 = data4.length;
for(let i0=0; i0<len0; i0++){
if(!(validate170.call(this, data4[i0], {instancePath:instancePath+"/evidence_refs/" + i0,parentData:data4,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
}
else {
const err11 = {instancePath:instancePath+"/evidence_refs",schemaPath:"#/properties/evidence_refs/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
else {
const err12 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
validate380.errors = vErrors;
return errors === 0;
}
validate380.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate376(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate376.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.run_ref === undefined) || (!(func0.call(data, "run_ref")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "run_ref"},message:"must have required property '"+"run_ref"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.plan_ref === undefined) || (!(func0.call(data, "plan_ref")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "plan_ref"},message:"must have required property '"+"plan_ref"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.generation === undefined) || (!(func0.call(data, "generation")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "generation"},message:"must have required property '"+"generation"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.state === undefined) || (!(func0.call(data, "state")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "state"},message:"must have required property '"+"state"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.steps === undefined) || (!(func0.call(data, "steps")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "steps"},message:"must have required property '"+"steps"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.source_execution_ref === undefined) || (!(func0.call(data, "source_execution_ref")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_execution_ref"},message:"must have required property '"+"source_execution_ref"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((((((key0 === "run_ref") || (key0 === "plan_ref")) || (key0 === "generation")) || (key0 === "state")) || (key0 === "steps")) || (key0 === "source_execution_ref"))){
const err6 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.run_ref !== undefined && func0.call(data, "run_ref")){
if(!(validate170.call(this, data.run_ref, {instancePath:instancePath+"/run_ref",parentData:data,parentDataProperty:"run_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
if(data.plan_ref !== undefined && func0.call(data, "plan_ref")){
if(!(validate170.call(this, data.plan_ref, {instancePath:instancePath+"/plan_ref",parentData:data,parentDataProperty:"plan_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
if(data.generation !== undefined && func0.call(data, "generation")){
if(!(validate101.call(this, data.generation, {instancePath:instancePath+"/generation",parentData:data,parentDataProperty:"generation",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.state !== undefined && func0.call(data, "state")){
let data3 = data.state;
if(!(((((((((data3 === "pending") || (data3 === "running")) || (data3 === "paused")) || (data3 === "succeeded")) || (data3 === "completed_with_failures")) || (data3 === "failed")) || (data3 === "unknown")) || (data3 === "blocked")) || (data3 === "cancelled"))){
const err7 = {instancePath:instancePath+"/state",schemaPath:"#/properties/state/enum",keyword:"enum",params:{allowedValues: schema97.properties.state.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.steps !== undefined && func0.call(data, "steps")){
let data4 = data.steps;
if(Array.isArray(data4)){
if(data4.length > 256){
const err8 = {instancePath:instancePath+"/steps",schemaPath:"#/properties/steps/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
const len0 = data4.length;
for(let i0=0; i0<len0; i0++){
if(!(validate380.call(this, data4[i0], {instancePath:instancePath+"/steps/" + i0,parentData:data4,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate380.errors : vErrors.concat(validate380.errors);
errors = vErrors.length;
}
}
}
else {
const err9 = {instancePath:instancePath+"/steps",schemaPath:"#/properties/steps/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.source_execution_ref !== undefined && func0.call(data, "source_execution_ref")){
let data6 = data.source_execution_ref;
const _errs10 = errors;
let valid3 = false;
const _errs11 = errors;
if(!(validate170.call(this, data6, {instancePath:instancePath+"/source_execution_ref",parentData:data,parentDataProperty:"source_execution_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
var _valid0 = _errs11 === errors;
valid3 = valid3 || _valid0;
const _errs12 = errors;
if(data6 !== null){
const err10 = {instancePath:instancePath+"/source_execution_ref",schemaPath:"#/properties/source_execution_ref/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
var _valid0 = _errs12 === errors;
valid3 = valid3 || _valid0;
if(!valid3){
const err11 = {instancePath:instancePath+"/source_execution_ref",schemaPath:"#/properties/source_execution_ref/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
else {
errors = _errs10;
if(vErrors !== null){
if(_errs10){
vErrors.length = _errs10;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err12 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
validate376.errors = vErrors;
return errors === 0;
}
validate376.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema99 = {"type":"object","properties":{"schedule_id":{"$ref":"#/$defs/snapshot__Id"},"active_version_ref":{"$ref":"#/$defs/snapshot__ObjectRef"},"activation_revision":{"$ref":"#/$defs/snapshot__Counter"},"calendar_profile_ref":{"$ref":"#/$defs/snapshot__ObjectRef"},"committed_at":{"$ref":"#/$defs/snapshot__Timestamp"},"qualification_state":{"enum":["eligible","blocked","unavailable"]}},"required":["schedule_id","active_version_ref","activation_revision","calendar_profile_ref","committed_at","qualification_state"],"additionalProperties":false};

function validate390(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate390.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.schedule_id === undefined) || (!(func0.call(data, "schedule_id")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "schedule_id"},message:"must have required property '"+"schedule_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.active_version_ref === undefined) || (!(func0.call(data, "active_version_ref")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "active_version_ref"},message:"must have required property '"+"active_version_ref"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.activation_revision === undefined) || (!(func0.call(data, "activation_revision")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "activation_revision"},message:"must have required property '"+"activation_revision"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.calendar_profile_ref === undefined) || (!(func0.call(data, "calendar_profile_ref")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "calendar_profile_ref"},message:"must have required property '"+"calendar_profile_ref"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.committed_at === undefined) || (!(func0.call(data, "committed_at")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "committed_at"},message:"must have required property '"+"committed_at"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.qualification_state === undefined) || (!(func0.call(data, "qualification_state")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "qualification_state"},message:"must have required property '"+"qualification_state"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((((((key0 === "schedule_id") || (key0 === "active_version_ref")) || (key0 === "activation_revision")) || (key0 === "calendar_profile_ref")) || (key0 === "committed_at")) || (key0 === "qualification_state"))){
const err6 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.schedule_id !== undefined && func0.call(data, "schedule_id")){
if(!(validate93.call(this, data.schedule_id, {instancePath:instancePath+"/schedule_id",parentData:data,parentDataProperty:"schedule_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.active_version_ref !== undefined && func0.call(data, "active_version_ref")){
if(!(validate170.call(this, data.active_version_ref, {instancePath:instancePath+"/active_version_ref",parentData:data,parentDataProperty:"active_version_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
if(data.activation_revision !== undefined && func0.call(data, "activation_revision")){
if(!(validate101.call(this, data.activation_revision, {instancePath:instancePath+"/activation_revision",parentData:data,parentDataProperty:"activation_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.calendar_profile_ref !== undefined && func0.call(data, "calendar_profile_ref")){
if(!(validate170.call(this, data.calendar_profile_ref, {instancePath:instancePath+"/calendar_profile_ref",parentData:data,parentDataProperty:"calendar_profile_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
if(data.committed_at !== undefined && func0.call(data, "committed_at")){
if(!(validate297.call(this, data.committed_at, {instancePath:instancePath+"/committed_at",parentData:data,parentDataProperty:"committed_at",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate297.errors : vErrors.concat(validate297.errors);
errors = vErrors.length;
}
}
if(data.qualification_state !== undefined && func0.call(data, "qualification_state")){
let data5 = data.qualification_state;
if(!(((data5 === "eligible") || (data5 === "blocked")) || (data5 === "unavailable"))){
const err7 = {instancePath:instancePath+"/qualification_state",schemaPath:"#/properties/qualification_state/enum",keyword:"enum",params:{allowedValues: schema99.properties.qualification_state.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
else {
const err8 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
validate390.errors = vErrors;
return errors === 0;
}
validate390.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema100 = {"type":"object","properties":{"logical_key_digest":{"$ref":"#/$defs/snapshot__Digest"},"schedule_id":{"$ref":"#/$defs/snapshot__Id"},"original_local_date":{"type":"string","format":"date"},"planned_at":{"$ref":"#/$defs/snapshot__Timestamp"},"window":{"type":"object","properties":{"earliest":{"$ref":"#/$defs/snapshot__Timestamp"},"latest":{"$ref":"#/$defs/snapshot__Timestamp"}},"required":["earliest","latest"],"additionalProperties":false},"activation_ref":{"$ref":"#/$defs/snapshot__ObjectRef"},"qualification_latch":{"enum":["eligible","blocked","missed","cancelled"]},"admission_state":{"enum":["unadmitted","accepted"]},"admission_ref":{"anyOf":[{"$ref":"#/$defs/snapshot__ObjectRef"},{"type":"null"}]},"execution_ref":{"anyOf":[{"$ref":"#/$defs/snapshot__ObjectRef"},{"type":"null"}]},"execution_summary":{"anyOf":[{"enum":["pending","running","succeeded","completed_with_failures","failed","unknown","blocked","cancelled"]},{"type":"null"}]},"reason_code":{"anyOf":[{"$ref":"#/$defs/snapshot__Id"},{"type":"null"}]},"replay_of":{"anyOf":[{"$ref":"#/$defs/snapshot__ObjectRef"},{"type":"null"}]}},"required":["logical_key_digest","schedule_id","original_local_date","planned_at","window","activation_ref","qualification_latch","admission_state","admission_ref","execution_ref","execution_summary","reason_code","replay_of"],"additionalProperties":false};
const formats4 = require("ajv-formats/dist/formats").fullFormats.date;

function validate400(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate400.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.logical_key_digest === undefined) || (!(func0.call(data, "logical_key_digest")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "logical_key_digest"},message:"must have required property '"+"logical_key_digest"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.schedule_id === undefined) || (!(func0.call(data, "schedule_id")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "schedule_id"},message:"must have required property '"+"schedule_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.original_local_date === undefined) || (!(func0.call(data, "original_local_date")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "original_local_date"},message:"must have required property '"+"original_local_date"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.planned_at === undefined) || (!(func0.call(data, "planned_at")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "planned_at"},message:"must have required property '"+"planned_at"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.window === undefined) || (!(func0.call(data, "window")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "window"},message:"must have required property '"+"window"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.activation_ref === undefined) || (!(func0.call(data, "activation_ref")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "activation_ref"},message:"must have required property '"+"activation_ref"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.qualification_latch === undefined) || (!(func0.call(data, "qualification_latch")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "qualification_latch"},message:"must have required property '"+"qualification_latch"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if((data.admission_state === undefined) || (!(func0.call(data, "admission_state")))){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "admission_state"},message:"must have required property '"+"admission_state"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if((data.admission_ref === undefined) || (!(func0.call(data, "admission_ref")))){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "admission_ref"},message:"must have required property '"+"admission_ref"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if((data.execution_ref === undefined) || (!(func0.call(data, "execution_ref")))){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "execution_ref"},message:"must have required property '"+"execution_ref"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if((data.execution_summary === undefined) || (!(func0.call(data, "execution_summary")))){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "execution_summary"},message:"must have required property '"+"execution_summary"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if((data.reason_code === undefined) || (!(func0.call(data, "reason_code")))){
const err11 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "reason_code"},message:"must have required property '"+"reason_code"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if((data.replay_of === undefined) || (!(func0.call(data, "replay_of")))){
const err12 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "replay_of"},message:"must have required property '"+"replay_of"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(func0.call(schema100.properties, key0))){
const err13 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.logical_key_digest !== undefined && func0.call(data, "logical_key_digest")){
if(!(validate99.call(this, data.logical_key_digest, {instancePath:instancePath+"/logical_key_digest",parentData:data,parentDataProperty:"logical_key_digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate99.errors : vErrors.concat(validate99.errors);
errors = vErrors.length;
}
}
if(data.schedule_id !== undefined && func0.call(data, "schedule_id")){
if(!(validate93.call(this, data.schedule_id, {instancePath:instancePath+"/schedule_id",parentData:data,parentDataProperty:"schedule_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.original_local_date !== undefined && func0.call(data, "original_local_date")){
let data2 = data.original_local_date;
if(typeof data2 === "string"){
if(!(formats4.validate(data2))){
const err14 = {instancePath:instancePath+"/original_local_date",schemaPath:"#/properties/original_local_date/format",keyword:"format",params:{format: "date"},message:"must match format \""+"date"+"\""};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
else {
const err15 = {instancePath:instancePath+"/original_local_date",schemaPath:"#/properties/original_local_date/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.planned_at !== undefined && func0.call(data, "planned_at")){
if(!(validate297.call(this, data.planned_at, {instancePath:instancePath+"/planned_at",parentData:data,parentDataProperty:"planned_at",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate297.errors : vErrors.concat(validate297.errors);
errors = vErrors.length;
}
}
if(data.window !== undefined && func0.call(data, "window")){
let data4 = data.window;
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
if((data4.earliest === undefined) || (!(func0.call(data4, "earliest")))){
const err16 = {instancePath:instancePath+"/window",schemaPath:"#/properties/window/required",keyword:"required",params:{missingProperty: "earliest"},message:"must have required property '"+"earliest"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if((data4.latest === undefined) || (!(func0.call(data4, "latest")))){
const err17 = {instancePath:instancePath+"/window",schemaPath:"#/properties/window/required",keyword:"required",params:{missingProperty: "latest"},message:"must have required property '"+"latest"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
for(const key1 of Object.keys(data4)){
if(!((key1 === "earliest") || (key1 === "latest"))){
const err18 = {instancePath:instancePath+"/window",schemaPath:"#/properties/window/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data4.earliest !== undefined && func0.call(data4, "earliest")){
if(!(validate297.call(this, data4.earliest, {instancePath:instancePath+"/window/earliest",parentData:data4,parentDataProperty:"earliest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate297.errors : vErrors.concat(validate297.errors);
errors = vErrors.length;
}
}
if(data4.latest !== undefined && func0.call(data4, "latest")){
if(!(validate297.call(this, data4.latest, {instancePath:instancePath+"/window/latest",parentData:data4,parentDataProperty:"latest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate297.errors : vErrors.concat(validate297.errors);
errors = vErrors.length;
}
}
}
else {
const err19 = {instancePath:instancePath+"/window",schemaPath:"#/properties/window/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.activation_ref !== undefined && func0.call(data, "activation_ref")){
if(!(validate170.call(this, data.activation_ref, {instancePath:instancePath+"/activation_ref",parentData:data,parentDataProperty:"activation_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
if(data.qualification_latch !== undefined && func0.call(data, "qualification_latch")){
let data8 = data.qualification_latch;
if(!((((data8 === "eligible") || (data8 === "blocked")) || (data8 === "missed")) || (data8 === "cancelled"))){
const err20 = {instancePath:instancePath+"/qualification_latch",schemaPath:"#/properties/qualification_latch/enum",keyword:"enum",params:{allowedValues: schema100.properties.qualification_latch.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.admission_state !== undefined && func0.call(data, "admission_state")){
let data9 = data.admission_state;
if(!((data9 === "unadmitted") || (data9 === "accepted"))){
const err21 = {instancePath:instancePath+"/admission_state",schemaPath:"#/properties/admission_state/enum",keyword:"enum",params:{allowedValues: schema100.properties.admission_state.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.admission_ref !== undefined && func0.call(data, "admission_ref")){
let data10 = data.admission_ref;
const _errs16 = errors;
let valid2 = false;
const _errs17 = errors;
if(!(validate170.call(this, data10, {instancePath:instancePath+"/admission_ref",parentData:data,parentDataProperty:"admission_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
var _valid0 = _errs17 === errors;
valid2 = valid2 || _valid0;
const _errs18 = errors;
if(data10 !== null){
const err22 = {instancePath:instancePath+"/admission_ref",schemaPath:"#/properties/admission_ref/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
var _valid0 = _errs18 === errors;
valid2 = valid2 || _valid0;
if(!valid2){
const err23 = {instancePath:instancePath+"/admission_ref",schemaPath:"#/properties/admission_ref/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
else {
errors = _errs16;
if(vErrors !== null){
if(_errs16){
vErrors.length = _errs16;
}
else {
vErrors = null;
}
}
}
}
if(data.execution_ref !== undefined && func0.call(data, "execution_ref")){
let data11 = data.execution_ref;
const _errs21 = errors;
let valid3 = false;
const _errs22 = errors;
if(!(validate170.call(this, data11, {instancePath:instancePath+"/execution_ref",parentData:data,parentDataProperty:"execution_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
var _valid1 = _errs22 === errors;
valid3 = valid3 || _valid1;
const _errs23 = errors;
if(data11 !== null){
const err24 = {instancePath:instancePath+"/execution_ref",schemaPath:"#/properties/execution_ref/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
var _valid1 = _errs23 === errors;
valid3 = valid3 || _valid1;
if(!valid3){
const err25 = {instancePath:instancePath+"/execution_ref",schemaPath:"#/properties/execution_ref/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
else {
errors = _errs21;
if(vErrors !== null){
if(_errs21){
vErrors.length = _errs21;
}
else {
vErrors = null;
}
}
}
}
if(data.execution_summary !== undefined && func0.call(data, "execution_summary")){
let data12 = data.execution_summary;
const _errs26 = errors;
let valid4 = false;
const _errs27 = errors;
if(!((((((((data12 === "pending") || (data12 === "running")) || (data12 === "succeeded")) || (data12 === "completed_with_failures")) || (data12 === "failed")) || (data12 === "unknown")) || (data12 === "blocked")) || (data12 === "cancelled"))){
const err26 = {instancePath:instancePath+"/execution_summary",schemaPath:"#/properties/execution_summary/anyOf/0/enum",keyword:"enum",params:{allowedValues: schema100.properties.execution_summary.anyOf[0].enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
var _valid2 = _errs27 === errors;
valid4 = valid4 || _valid2;
const _errs28 = errors;
if(data12 !== null){
const err27 = {instancePath:instancePath+"/execution_summary",schemaPath:"#/properties/execution_summary/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
var _valid2 = _errs28 === errors;
valid4 = valid4 || _valid2;
if(!valid4){
const err28 = {instancePath:instancePath+"/execution_summary",schemaPath:"#/properties/execution_summary/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
else {
errors = _errs26;
if(vErrors !== null){
if(_errs26){
vErrors.length = _errs26;
}
else {
vErrors = null;
}
}
}
}
if(data.reason_code !== undefined && func0.call(data, "reason_code")){
let data13 = data.reason_code;
const _errs31 = errors;
let valid5 = false;
const _errs32 = errors;
if(!(validate93.call(this, data13, {instancePath:instancePath+"/reason_code",parentData:data,parentDataProperty:"reason_code",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
var _valid3 = _errs32 === errors;
valid5 = valid5 || _valid3;
const _errs33 = errors;
if(data13 !== null){
const err29 = {instancePath:instancePath+"/reason_code",schemaPath:"#/properties/reason_code/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
var _valid3 = _errs33 === errors;
valid5 = valid5 || _valid3;
if(!valid5){
const err30 = {instancePath:instancePath+"/reason_code",schemaPath:"#/properties/reason_code/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
else {
errors = _errs31;
if(vErrors !== null){
if(_errs31){
vErrors.length = _errs31;
}
else {
vErrors = null;
}
}
}
}
if(data.replay_of !== undefined && func0.call(data, "replay_of")){
let data14 = data.replay_of;
const _errs36 = errors;
let valid6 = false;
const _errs37 = errors;
if(!(validate170.call(this, data14, {instancePath:instancePath+"/replay_of",parentData:data,parentDataProperty:"replay_of",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
var _valid4 = _errs37 === errors;
valid6 = valid6 || _valid4;
const _errs38 = errors;
if(data14 !== null){
const err31 = {instancePath:instancePath+"/replay_of",schemaPath:"#/properties/replay_of/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
var _valid4 = _errs38 === errors;
valid6 = valid6 || _valid4;
if(!valid6){
const err32 = {instancePath:instancePath+"/replay_of",schemaPath:"#/properties/replay_of/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
else {
errors = _errs36;
if(vErrors !== null){
if(_errs36){
vErrors.length = _errs36;
}
else {
vErrors = null;
}
}
}
}
}
else {
const err33 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
validate400.errors = vErrors;
return errors === 0;
}
validate400.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate164(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate164.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs0 = errors;
let valid0 = false;
let passing0 = null;
const _errs1 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.entity_kind === undefined) || (!(func0.call(data, "entity_kind")))){
const err0 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "entity_kind"},message:"must have required property '"+"entity_kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.entity_id === undefined) || (!(func0.call(data, "entity_id")))){
const err1 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "entity_id"},message:"must have required property '"+"entity_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.entity_epoch === undefined) || (!(func0.call(data, "entity_epoch")))){
const err2 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "entity_epoch"},message:"must have required property '"+"entity_epoch"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.entity_revision === undefined) || (!(func0.call(data, "entity_revision")))){
const err3 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "entity_revision"},message:"must have required property '"+"entity_revision"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.view === undefined) || (!(func0.call(data, "view")))){
const err4 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "view"},message:"must have required property '"+"view"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(((((key0 === "entity_kind") || (key0 === "entity_id")) || (key0 === "entity_epoch")) || (key0 === "entity_revision")) || (key0 === "view"))){
const err5 = {instancePath,schemaPath:"#/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.entity_kind !== undefined && func0.call(data, "entity_kind")){
if("devices" !== data.entity_kind){
const err6 = {instancePath:instancePath+"/entity_kind",schemaPath:"#/oneOf/0/properties/entity_kind/const",keyword:"const",params:{allowedValue: "devices"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.entity_id !== undefined && func0.call(data, "entity_id")){
if(!(validate93.call(this, data.entity_id, {instancePath:instancePath+"/entity_id",parentData:data,parentDataProperty:"entity_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_epoch !== undefined && func0.call(data, "entity_epoch")){
if(!(validate93.call(this, data.entity_epoch, {instancePath:instancePath+"/entity_epoch",parentData:data,parentDataProperty:"entity_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_revision !== undefined && func0.call(data, "entity_revision")){
if(!(validate101.call(this, data.entity_revision, {instancePath:instancePath+"/entity_revision",parentData:data,parentDataProperty:"entity_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.view !== undefined && func0.call(data, "view")){
if(!(validate168.call(this, data.view, {instancePath:instancePath+"/view",parentData:data,parentDataProperty:"view",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate168.errors : vErrors.concat(validate168.errors);
errors = vErrors.length;
}
}
}
else {
const err7 = {instancePath,schemaPath:"#/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs9 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.entity_kind === undefined) || (!(func0.call(data, "entity_kind")))){
const err8 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "entity_kind"},message:"must have required property '"+"entity_kind"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if((data.entity_id === undefined) || (!(func0.call(data, "entity_id")))){
const err9 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "entity_id"},message:"must have required property '"+"entity_id"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if((data.entity_epoch === undefined) || (!(func0.call(data, "entity_epoch")))){
const err10 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "entity_epoch"},message:"must have required property '"+"entity_epoch"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if((data.entity_revision === undefined) || (!(func0.call(data, "entity_revision")))){
const err11 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "entity_revision"},message:"must have required property '"+"entity_revision"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if((data.view === undefined) || (!(func0.call(data, "view")))){
const err12 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "view"},message:"must have required property '"+"view"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
for(const key1 of Object.keys(data)){
if(!(((((key1 === "entity_kind") || (key1 === "entity_id")) || (key1 === "entity_epoch")) || (key1 === "entity_revision")) || (key1 === "view"))){
const err13 = {instancePath,schemaPath:"#/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.entity_kind !== undefined && func0.call(data, "entity_kind")){
if("catalogs" !== data.entity_kind){
const err14 = {instancePath:instancePath+"/entity_kind",schemaPath:"#/oneOf/1/properties/entity_kind/const",keyword:"const",params:{allowedValue: "catalogs"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.entity_id !== undefined && func0.call(data, "entity_id")){
if(!(validate93.call(this, data.entity_id, {instancePath:instancePath+"/entity_id",parentData:data,parentDataProperty:"entity_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_epoch !== undefined && func0.call(data, "entity_epoch")){
if(!(validate93.call(this, data.entity_epoch, {instancePath:instancePath+"/entity_epoch",parentData:data,parentDataProperty:"entity_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_revision !== undefined && func0.call(data, "entity_revision")){
if(!(validate101.call(this, data.entity_revision, {instancePath:instancePath+"/entity_revision",parentData:data,parentDataProperty:"entity_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.view !== undefined && func0.call(data, "view")){
if(!(validate183.call(this, data.view, {instancePath:instancePath+"/view",parentData:data,parentDataProperty:"view",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate183.errors : vErrors.concat(validate183.errors);
errors = vErrors.length;
}
}
}
else {
const err15 = {instancePath,schemaPath:"#/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
var _valid0 = _errs9 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid0 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
const _errs17 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.entity_kind === undefined) || (!(func0.call(data, "entity_kind")))){
const err16 = {instancePath,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty: "entity_kind"},message:"must have required property '"+"entity_kind"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if((data.entity_id === undefined) || (!(func0.call(data, "entity_id")))){
const err17 = {instancePath,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty: "entity_id"},message:"must have required property '"+"entity_id"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if((data.entity_epoch === undefined) || (!(func0.call(data, "entity_epoch")))){
const err18 = {instancePath,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty: "entity_epoch"},message:"must have required property '"+"entity_epoch"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if((data.entity_revision === undefined) || (!(func0.call(data, "entity_revision")))){
const err19 = {instancePath,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty: "entity_revision"},message:"must have required property '"+"entity_revision"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if((data.view === undefined) || (!(func0.call(data, "view")))){
const err20 = {instancePath,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty: "view"},message:"must have required property '"+"view"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
for(const key2 of Object.keys(data)){
if(!(((((key2 === "entity_kind") || (key2 === "entity_id")) || (key2 === "entity_epoch")) || (key2 === "entity_revision")) || (key2 === "view"))){
const err21 = {instancePath,schemaPath:"#/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.entity_kind !== undefined && func0.call(data, "entity_kind")){
if("commands" !== data.entity_kind){
const err22 = {instancePath:instancePath+"/entity_kind",schemaPath:"#/oneOf/2/properties/entity_kind/const",keyword:"const",params:{allowedValue: "commands"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.entity_id !== undefined && func0.call(data, "entity_id")){
if(!(validate93.call(this, data.entity_id, {instancePath:instancePath+"/entity_id",parentData:data,parentDataProperty:"entity_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_epoch !== undefined && func0.call(data, "entity_epoch")){
if(!(validate93.call(this, data.entity_epoch, {instancePath:instancePath+"/entity_epoch",parentData:data,parentDataProperty:"entity_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_revision !== undefined && func0.call(data, "entity_revision")){
if(!(validate101.call(this, data.entity_revision, {instancePath:instancePath+"/entity_revision",parentData:data,parentDataProperty:"entity_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.view !== undefined && func0.call(data, "view")){
if(!(validate195.call(this, data.view, {instancePath:instancePath+"/view",parentData:data,parentDataProperty:"view",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate195.errors : vErrors.concat(validate195.errors);
errors = vErrors.length;
}
}
}
else {
const err23 = {instancePath,schemaPath:"#/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
var _valid0 = _errs17 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid0 = true;
passing0 = 2;
if(props0 !== true){
props0 = true;
}
}
const _errs25 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.entity_kind === undefined) || (!(func0.call(data, "entity_kind")))){
const err24 = {instancePath,schemaPath:"#/oneOf/3/required",keyword:"required",params:{missingProperty: "entity_kind"},message:"must have required property '"+"entity_kind"+"'"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if((data.entity_id === undefined) || (!(func0.call(data, "entity_id")))){
const err25 = {instancePath,schemaPath:"#/oneOf/3/required",keyword:"required",params:{missingProperty: "entity_id"},message:"must have required property '"+"entity_id"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if((data.entity_epoch === undefined) || (!(func0.call(data, "entity_epoch")))){
const err26 = {instancePath,schemaPath:"#/oneOf/3/required",keyword:"required",params:{missingProperty: "entity_epoch"},message:"must have required property '"+"entity_epoch"+"'"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if((data.entity_revision === undefined) || (!(func0.call(data, "entity_revision")))){
const err27 = {instancePath,schemaPath:"#/oneOf/3/required",keyword:"required",params:{missingProperty: "entity_revision"},message:"must have required property '"+"entity_revision"+"'"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if((data.view === undefined) || (!(func0.call(data, "view")))){
const err28 = {instancePath,schemaPath:"#/oneOf/3/required",keyword:"required",params:{missingProperty: "view"},message:"must have required property '"+"view"+"'"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
for(const key3 of Object.keys(data)){
if(!(((((key3 === "entity_kind") || (key3 === "entity_id")) || (key3 === "entity_epoch")) || (key3 === "entity_revision")) || (key3 === "view"))){
const err29 = {instancePath,schemaPath:"#/oneOf/3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data.entity_kind !== undefined && func0.call(data, "entity_kind")){
if("controls" !== data.entity_kind){
const err30 = {instancePath:instancePath+"/entity_kind",schemaPath:"#/oneOf/3/properties/entity_kind/const",keyword:"const",params:{allowedValue: "controls"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data.entity_id !== undefined && func0.call(data, "entity_id")){
if(!(validate93.call(this, data.entity_id, {instancePath:instancePath+"/entity_id",parentData:data,parentDataProperty:"entity_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_epoch !== undefined && func0.call(data, "entity_epoch")){
if(!(validate93.call(this, data.entity_epoch, {instancePath:instancePath+"/entity_epoch",parentData:data,parentDataProperty:"entity_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_revision !== undefined && func0.call(data, "entity_revision")){
if(!(validate101.call(this, data.entity_revision, {instancePath:instancePath+"/entity_revision",parentData:data,parentDataProperty:"entity_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.view !== undefined && func0.call(data, "view")){
if(!(validate280.call(this, data.view, {instancePath:instancePath+"/view",parentData:data,parentDataProperty:"view",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate280.errors : vErrors.concat(validate280.errors);
errors = vErrors.length;
}
}
}
else {
const err31 = {instancePath,schemaPath:"#/oneOf/3/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
var _valid0 = _errs25 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid0 = true;
passing0 = 3;
if(props0 !== true){
props0 = true;
}
}
const _errs33 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.entity_kind === undefined) || (!(func0.call(data, "entity_kind")))){
const err32 = {instancePath,schemaPath:"#/oneOf/4/required",keyword:"required",params:{missingProperty: "entity_kind"},message:"must have required property '"+"entity_kind"+"'"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if((data.entity_id === undefined) || (!(func0.call(data, "entity_id")))){
const err33 = {instancePath,schemaPath:"#/oneOf/4/required",keyword:"required",params:{missingProperty: "entity_id"},message:"must have required property '"+"entity_id"+"'"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if((data.entity_epoch === undefined) || (!(func0.call(data, "entity_epoch")))){
const err34 = {instancePath,schemaPath:"#/oneOf/4/required",keyword:"required",params:{missingProperty: "entity_epoch"},message:"must have required property '"+"entity_epoch"+"'"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if((data.entity_revision === undefined) || (!(func0.call(data, "entity_revision")))){
const err35 = {instancePath,schemaPath:"#/oneOf/4/required",keyword:"required",params:{missingProperty: "entity_revision"},message:"must have required property '"+"entity_revision"+"'"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if((data.view === undefined) || (!(func0.call(data, "view")))){
const err36 = {instancePath,schemaPath:"#/oneOf/4/required",keyword:"required",params:{missingProperty: "view"},message:"must have required property '"+"view"+"'"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
for(const key4 of Object.keys(data)){
if(!(((((key4 === "entity_kind") || (key4 === "entity_id")) || (key4 === "entity_epoch")) || (key4 === "entity_revision")) || (key4 === "view"))){
const err37 = {instancePath,schemaPath:"#/oneOf/4/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data.entity_kind !== undefined && func0.call(data, "entity_kind")){
if("observations" !== data.entity_kind){
const err38 = {instancePath:instancePath+"/entity_kind",schemaPath:"#/oneOf/4/properties/entity_kind/const",keyword:"const",params:{allowedValue: "observations"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data.entity_id !== undefined && func0.call(data, "entity_id")){
if(!(validate93.call(this, data.entity_id, {instancePath:instancePath+"/entity_id",parentData:data,parentDataProperty:"entity_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_epoch !== undefined && func0.call(data, "entity_epoch")){
if(!(validate93.call(this, data.entity_epoch, {instancePath:instancePath+"/entity_epoch",parentData:data,parentDataProperty:"entity_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_revision !== undefined && func0.call(data, "entity_revision")){
if(!(validate101.call(this, data.entity_revision, {instancePath:instancePath+"/entity_revision",parentData:data,parentDataProperty:"entity_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.view !== undefined && func0.call(data, "view")){
if(!(validate307.call(this, data.view, {instancePath:instancePath+"/view",parentData:data,parentDataProperty:"view",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate307.errors : vErrors.concat(validate307.errors);
errors = vErrors.length;
}
}
}
else {
const err39 = {instancePath,schemaPath:"#/oneOf/4/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
var _valid0 = _errs33 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 4];
}
else {
if(_valid0){
valid0 = true;
passing0 = 4;
if(props0 !== true){
props0 = true;
}
}
const _errs41 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.entity_kind === undefined) || (!(func0.call(data, "entity_kind")))){
const err40 = {instancePath,schemaPath:"#/oneOf/5/required",keyword:"required",params:{missingProperty: "entity_kind"},message:"must have required property '"+"entity_kind"+"'"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if((data.entity_id === undefined) || (!(func0.call(data, "entity_id")))){
const err41 = {instancePath,schemaPath:"#/oneOf/5/required",keyword:"required",params:{missingProperty: "entity_id"},message:"must have required property '"+"entity_id"+"'"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if((data.entity_epoch === undefined) || (!(func0.call(data, "entity_epoch")))){
const err42 = {instancePath,schemaPath:"#/oneOf/5/required",keyword:"required",params:{missingProperty: "entity_epoch"},message:"must have required property '"+"entity_epoch"+"'"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if((data.entity_revision === undefined) || (!(func0.call(data, "entity_revision")))){
const err43 = {instancePath,schemaPath:"#/oneOf/5/required",keyword:"required",params:{missingProperty: "entity_revision"},message:"must have required property '"+"entity_revision"+"'"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if((data.view === undefined) || (!(func0.call(data, "view")))){
const err44 = {instancePath,schemaPath:"#/oneOf/5/required",keyword:"required",params:{missingProperty: "view"},message:"must have required property '"+"view"+"'"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
for(const key5 of Object.keys(data)){
if(!(((((key5 === "entity_kind") || (key5 === "entity_id")) || (key5 === "entity_epoch")) || (key5 === "entity_revision")) || (key5 === "view"))){
const err45 = {instancePath,schemaPath:"#/oneOf/5/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
if(data.entity_kind !== undefined && func0.call(data, "entity_kind")){
if("sources" !== data.entity_kind){
const err46 = {instancePath:instancePath+"/entity_kind",schemaPath:"#/oneOf/5/properties/entity_kind/const",keyword:"const",params:{allowedValue: "sources"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(data.entity_id !== undefined && func0.call(data, "entity_id")){
if(!(validate93.call(this, data.entity_id, {instancePath:instancePath+"/entity_id",parentData:data,parentDataProperty:"entity_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_epoch !== undefined && func0.call(data, "entity_epoch")){
if(!(validate93.call(this, data.entity_epoch, {instancePath:instancePath+"/entity_epoch",parentData:data,parentDataProperty:"entity_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_revision !== undefined && func0.call(data, "entity_revision")){
if(!(validate101.call(this, data.entity_revision, {instancePath:instancePath+"/entity_revision",parentData:data,parentDataProperty:"entity_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.view !== undefined && func0.call(data, "view")){
if(!(validate330.call(this, data.view, {instancePath:instancePath+"/view",parentData:data,parentDataProperty:"view",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate330.errors : vErrors.concat(validate330.errors);
errors = vErrors.length;
}
}
}
else {
const err47 = {instancePath,schemaPath:"#/oneOf/5/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
var _valid0 = _errs41 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 5];
}
else {
if(_valid0){
valid0 = true;
passing0 = 5;
if(props0 !== true){
props0 = true;
}
}
const _errs49 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.entity_kind === undefined) || (!(func0.call(data, "entity_kind")))){
const err48 = {instancePath,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty: "entity_kind"},message:"must have required property '"+"entity_kind"+"'"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if((data.entity_id === undefined) || (!(func0.call(data, "entity_id")))){
const err49 = {instancePath,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty: "entity_id"},message:"must have required property '"+"entity_id"+"'"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if((data.entity_epoch === undefined) || (!(func0.call(data, "entity_epoch")))){
const err50 = {instancePath,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty: "entity_epoch"},message:"must have required property '"+"entity_epoch"+"'"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if((data.entity_revision === undefined) || (!(func0.call(data, "entity_revision")))){
const err51 = {instancePath,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty: "entity_revision"},message:"must have required property '"+"entity_revision"+"'"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if((data.view === undefined) || (!(func0.call(data, "view")))){
const err52 = {instancePath,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty: "view"},message:"must have required property '"+"view"+"'"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
for(const key6 of Object.keys(data)){
if(!(((((key6 === "entity_kind") || (key6 === "entity_id")) || (key6 === "entity_epoch")) || (key6 === "entity_revision")) || (key6 === "view"))){
const err53 = {instancePath,schemaPath:"#/oneOf/6/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
if(data.entity_kind !== undefined && func0.call(data, "entity_kind")){
if("definitions" !== data.entity_kind){
const err54 = {instancePath:instancePath+"/entity_kind",schemaPath:"#/oneOf/6/properties/entity_kind/const",keyword:"const",params:{allowedValue: "definitions"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
if(data.entity_id !== undefined && func0.call(data, "entity_id")){
if(!(validate93.call(this, data.entity_id, {instancePath:instancePath+"/entity_id",parentData:data,parentDataProperty:"entity_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_epoch !== undefined && func0.call(data, "entity_epoch")){
if(!(validate93.call(this, data.entity_epoch, {instancePath:instancePath+"/entity_epoch",parentData:data,parentDataProperty:"entity_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_revision !== undefined && func0.call(data, "entity_revision")){
if(!(validate101.call(this, data.entity_revision, {instancePath:instancePath+"/entity_revision",parentData:data,parentDataProperty:"entity_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.view !== undefined && func0.call(data, "view")){
if(!(validate345.call(this, data.view, {instancePath:instancePath+"/view",parentData:data,parentDataProperty:"view",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate345.errors : vErrors.concat(validate345.errors);
errors = vErrors.length;
}
}
}
else {
const err55 = {instancePath,schemaPath:"#/oneOf/6/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
var _valid0 = _errs49 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 6];
}
else {
if(_valid0){
valid0 = true;
passing0 = 6;
if(props0 !== true){
props0 = true;
}
}
const _errs57 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.entity_kind === undefined) || (!(func0.call(data, "entity_kind")))){
const err56 = {instancePath,schemaPath:"#/oneOf/7/required",keyword:"required",params:{missingProperty: "entity_kind"},message:"must have required property '"+"entity_kind"+"'"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if((data.entity_id === undefined) || (!(func0.call(data, "entity_id")))){
const err57 = {instancePath,schemaPath:"#/oneOf/7/required",keyword:"required",params:{missingProperty: "entity_id"},message:"must have required property '"+"entity_id"+"'"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if((data.entity_epoch === undefined) || (!(func0.call(data, "entity_epoch")))){
const err58 = {instancePath,schemaPath:"#/oneOf/7/required",keyword:"required",params:{missingProperty: "entity_epoch"},message:"must have required property '"+"entity_epoch"+"'"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
if((data.entity_revision === undefined) || (!(func0.call(data, "entity_revision")))){
const err59 = {instancePath,schemaPath:"#/oneOf/7/required",keyword:"required",params:{missingProperty: "entity_revision"},message:"must have required property '"+"entity_revision"+"'"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if((data.view === undefined) || (!(func0.call(data, "view")))){
const err60 = {instancePath,schemaPath:"#/oneOf/7/required",keyword:"required",params:{missingProperty: "view"},message:"must have required property '"+"view"+"'"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
for(const key7 of Object.keys(data)){
if(!(((((key7 === "entity_kind") || (key7 === "entity_id")) || (key7 === "entity_epoch")) || (key7 === "entity_revision")) || (key7 === "view"))){
const err61 = {instancePath,schemaPath:"#/oneOf/7/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key7},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
if(data.entity_kind !== undefined && func0.call(data, "entity_kind")){
if("runs" !== data.entity_kind){
const err62 = {instancePath:instancePath+"/entity_kind",schemaPath:"#/oneOf/7/properties/entity_kind/const",keyword:"const",params:{allowedValue: "runs"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
if(data.entity_id !== undefined && func0.call(data, "entity_id")){
if(!(validate93.call(this, data.entity_id, {instancePath:instancePath+"/entity_id",parentData:data,parentDataProperty:"entity_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_epoch !== undefined && func0.call(data, "entity_epoch")){
if(!(validate93.call(this, data.entity_epoch, {instancePath:instancePath+"/entity_epoch",parentData:data,parentDataProperty:"entity_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_revision !== undefined && func0.call(data, "entity_revision")){
if(!(validate101.call(this, data.entity_revision, {instancePath:instancePath+"/entity_revision",parentData:data,parentDataProperty:"entity_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.view !== undefined && func0.call(data, "view")){
if(!(validate352.call(this, data.view, {instancePath:instancePath+"/view",parentData:data,parentDataProperty:"view",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate352.errors : vErrors.concat(validate352.errors);
errors = vErrors.length;
}
}
}
else {
const err63 = {instancePath,schemaPath:"#/oneOf/7/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
var _valid0 = _errs57 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 7];
}
else {
if(_valid0){
valid0 = true;
passing0 = 7;
if(props0 !== true){
props0 = true;
}
}
const _errs65 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.entity_kind === undefined) || (!(func0.call(data, "entity_kind")))){
const err64 = {instancePath,schemaPath:"#/oneOf/8/required",keyword:"required",params:{missingProperty: "entity_kind"},message:"must have required property '"+"entity_kind"+"'"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
if((data.entity_id === undefined) || (!(func0.call(data, "entity_id")))){
const err65 = {instancePath,schemaPath:"#/oneOf/8/required",keyword:"required",params:{missingProperty: "entity_id"},message:"must have required property '"+"entity_id"+"'"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if((data.entity_epoch === undefined) || (!(func0.call(data, "entity_epoch")))){
const err66 = {instancePath,schemaPath:"#/oneOf/8/required",keyword:"required",params:{missingProperty: "entity_epoch"},message:"must have required property '"+"entity_epoch"+"'"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
if((data.entity_revision === undefined) || (!(func0.call(data, "entity_revision")))){
const err67 = {instancePath,schemaPath:"#/oneOf/8/required",keyword:"required",params:{missingProperty: "entity_revision"},message:"must have required property '"+"entity_revision"+"'"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if((data.view === undefined) || (!(func0.call(data, "view")))){
const err68 = {instancePath,schemaPath:"#/oneOf/8/required",keyword:"required",params:{missingProperty: "view"},message:"must have required property '"+"view"+"'"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
for(const key8 of Object.keys(data)){
if(!(((((key8 === "entity_kind") || (key8 === "entity_id")) || (key8 === "entity_epoch")) || (key8 === "entity_revision")) || (key8 === "view"))){
const err69 = {instancePath,schemaPath:"#/oneOf/8/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key8},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
if(data.entity_kind !== undefined && func0.call(data, "entity_kind")){
if("business_states" !== data.entity_kind){
const err70 = {instancePath:instancePath+"/entity_kind",schemaPath:"#/oneOf/8/properties/entity_kind/const",keyword:"const",params:{allowedValue: "business_states"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
if(data.entity_id !== undefined && func0.call(data, "entity_id")){
if(!(validate93.call(this, data.entity_id, {instancePath:instancePath+"/entity_id",parentData:data,parentDataProperty:"entity_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_epoch !== undefined && func0.call(data, "entity_epoch")){
if(!(validate93.call(this, data.entity_epoch, {instancePath:instancePath+"/entity_epoch",parentData:data,parentDataProperty:"entity_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_revision !== undefined && func0.call(data, "entity_revision")){
if(!(validate101.call(this, data.entity_revision, {instancePath:instancePath+"/entity_revision",parentData:data,parentDataProperty:"entity_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.view !== undefined && func0.call(data, "view")){
if(!(validate367.call(this, data.view, {instancePath:instancePath+"/view",parentData:data,parentDataProperty:"view",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate367.errors : vErrors.concat(validate367.errors);
errors = vErrors.length;
}
}
}
else {
const err71 = {instancePath,schemaPath:"#/oneOf/8/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
var _valid0 = _errs65 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 8];
}
else {
if(_valid0){
valid0 = true;
passing0 = 8;
if(props0 !== true){
props0 = true;
}
}
const _errs73 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.entity_kind === undefined) || (!(func0.call(data, "entity_kind")))){
const err72 = {instancePath,schemaPath:"#/oneOf/9/required",keyword:"required",params:{missingProperty: "entity_kind"},message:"must have required property '"+"entity_kind"+"'"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
if((data.entity_id === undefined) || (!(func0.call(data, "entity_id")))){
const err73 = {instancePath,schemaPath:"#/oneOf/9/required",keyword:"required",params:{missingProperty: "entity_id"},message:"must have required property '"+"entity_id"+"'"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
if((data.entity_epoch === undefined) || (!(func0.call(data, "entity_epoch")))){
const err74 = {instancePath,schemaPath:"#/oneOf/9/required",keyword:"required",params:{missingProperty: "entity_epoch"},message:"must have required property '"+"entity_epoch"+"'"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if((data.entity_revision === undefined) || (!(func0.call(data, "entity_revision")))){
const err75 = {instancePath,schemaPath:"#/oneOf/9/required",keyword:"required",params:{missingProperty: "entity_revision"},message:"must have required property '"+"entity_revision"+"'"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
if((data.view === undefined) || (!(func0.call(data, "view")))){
const err76 = {instancePath,schemaPath:"#/oneOf/9/required",keyword:"required",params:{missingProperty: "view"},message:"must have required property '"+"view"+"'"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
for(const key9 of Object.keys(data)){
if(!(((((key9 === "entity_kind") || (key9 === "entity_id")) || (key9 === "entity_epoch")) || (key9 === "entity_revision")) || (key9 === "view"))){
const err77 = {instancePath,schemaPath:"#/oneOf/9/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key9},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
if(data.entity_kind !== undefined && func0.call(data, "entity_kind")){
if("executions" !== data.entity_kind){
const err78 = {instancePath:instancePath+"/entity_kind",schemaPath:"#/oneOf/9/properties/entity_kind/const",keyword:"const",params:{allowedValue: "executions"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
if(data.entity_id !== undefined && func0.call(data, "entity_id")){
if(!(validate93.call(this, data.entity_id, {instancePath:instancePath+"/entity_id",parentData:data,parentDataProperty:"entity_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_epoch !== undefined && func0.call(data, "entity_epoch")){
if(!(validate93.call(this, data.entity_epoch, {instancePath:instancePath+"/entity_epoch",parentData:data,parentDataProperty:"entity_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_revision !== undefined && func0.call(data, "entity_revision")){
if(!(validate101.call(this, data.entity_revision, {instancePath:instancePath+"/entity_revision",parentData:data,parentDataProperty:"entity_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.view !== undefined && func0.call(data, "view")){
if(!(validate376.call(this, data.view, {instancePath:instancePath+"/view",parentData:data,parentDataProperty:"view",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate376.errors : vErrors.concat(validate376.errors);
errors = vErrors.length;
}
}
}
else {
const err79 = {instancePath,schemaPath:"#/oneOf/9/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
var _valid0 = _errs73 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 9];
}
else {
if(_valid0){
valid0 = true;
passing0 = 9;
if(props0 !== true){
props0 = true;
}
}
const _errs81 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.entity_kind === undefined) || (!(func0.call(data, "entity_kind")))){
const err80 = {instancePath,schemaPath:"#/oneOf/10/required",keyword:"required",params:{missingProperty: "entity_kind"},message:"must have required property '"+"entity_kind"+"'"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
if((data.entity_id === undefined) || (!(func0.call(data, "entity_id")))){
const err81 = {instancePath,schemaPath:"#/oneOf/10/required",keyword:"required",params:{missingProperty: "entity_id"},message:"must have required property '"+"entity_id"+"'"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if((data.entity_epoch === undefined) || (!(func0.call(data, "entity_epoch")))){
const err82 = {instancePath,schemaPath:"#/oneOf/10/required",keyword:"required",params:{missingProperty: "entity_epoch"},message:"must have required property '"+"entity_epoch"+"'"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
if((data.entity_revision === undefined) || (!(func0.call(data, "entity_revision")))){
const err83 = {instancePath,schemaPath:"#/oneOf/10/required",keyword:"required",params:{missingProperty: "entity_revision"},message:"must have required property '"+"entity_revision"+"'"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if((data.view === undefined) || (!(func0.call(data, "view")))){
const err84 = {instancePath,schemaPath:"#/oneOf/10/required",keyword:"required",params:{missingProperty: "view"},message:"must have required property '"+"view"+"'"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
for(const key10 of Object.keys(data)){
if(!(((((key10 === "entity_kind") || (key10 === "entity_id")) || (key10 === "entity_epoch")) || (key10 === "entity_revision")) || (key10 === "view"))){
const err85 = {instancePath,schemaPath:"#/oneOf/10/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key10},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
if(data.entity_kind !== undefined && func0.call(data, "entity_kind")){
if("schedule_activations" !== data.entity_kind){
const err86 = {instancePath:instancePath+"/entity_kind",schemaPath:"#/oneOf/10/properties/entity_kind/const",keyword:"const",params:{allowedValue: "schedule_activations"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
if(data.entity_id !== undefined && func0.call(data, "entity_id")){
if(!(validate93.call(this, data.entity_id, {instancePath:instancePath+"/entity_id",parentData:data,parentDataProperty:"entity_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_epoch !== undefined && func0.call(data, "entity_epoch")){
if(!(validate93.call(this, data.entity_epoch, {instancePath:instancePath+"/entity_epoch",parentData:data,parentDataProperty:"entity_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_revision !== undefined && func0.call(data, "entity_revision")){
if(!(validate101.call(this, data.entity_revision, {instancePath:instancePath+"/entity_revision",parentData:data,parentDataProperty:"entity_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.view !== undefined && func0.call(data, "view")){
if(!(validate390.call(this, data.view, {instancePath:instancePath+"/view",parentData:data,parentDataProperty:"view",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate390.errors : vErrors.concat(validate390.errors);
errors = vErrors.length;
}
}
}
else {
const err87 = {instancePath,schemaPath:"#/oneOf/10/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
var _valid0 = _errs81 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 10];
}
else {
if(_valid0){
valid0 = true;
passing0 = 10;
if(props0 !== true){
props0 = true;
}
}
const _errs89 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.entity_kind === undefined) || (!(func0.call(data, "entity_kind")))){
const err88 = {instancePath,schemaPath:"#/oneOf/11/required",keyword:"required",params:{missingProperty: "entity_kind"},message:"must have required property '"+"entity_kind"+"'"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
if((data.entity_id === undefined) || (!(func0.call(data, "entity_id")))){
const err89 = {instancePath,schemaPath:"#/oneOf/11/required",keyword:"required",params:{missingProperty: "entity_id"},message:"must have required property '"+"entity_id"+"'"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
if((data.entity_epoch === undefined) || (!(func0.call(data, "entity_epoch")))){
const err90 = {instancePath,schemaPath:"#/oneOf/11/required",keyword:"required",params:{missingProperty: "entity_epoch"},message:"must have required property '"+"entity_epoch"+"'"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
if((data.entity_revision === undefined) || (!(func0.call(data, "entity_revision")))){
const err91 = {instancePath,schemaPath:"#/oneOf/11/required",keyword:"required",params:{missingProperty: "entity_revision"},message:"must have required property '"+"entity_revision"+"'"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
if((data.view === undefined) || (!(func0.call(data, "view")))){
const err92 = {instancePath,schemaPath:"#/oneOf/11/required",keyword:"required",params:{missingProperty: "view"},message:"must have required property '"+"view"+"'"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
for(const key11 of Object.keys(data)){
if(!(((((key11 === "entity_kind") || (key11 === "entity_id")) || (key11 === "entity_epoch")) || (key11 === "entity_revision")) || (key11 === "view"))){
const err93 = {instancePath,schemaPath:"#/oneOf/11/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key11},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
}
if(data.entity_kind !== undefined && func0.call(data, "entity_kind")){
if("occurrences" !== data.entity_kind){
const err94 = {instancePath:instancePath+"/entity_kind",schemaPath:"#/oneOf/11/properties/entity_kind/const",keyword:"const",params:{allowedValue: "occurrences"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
}
if(data.entity_id !== undefined && func0.call(data, "entity_id")){
if(!(validate93.call(this, data.entity_id, {instancePath:instancePath+"/entity_id",parentData:data,parentDataProperty:"entity_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_epoch !== undefined && func0.call(data, "entity_epoch")){
if(!(validate93.call(this, data.entity_epoch, {instancePath:instancePath+"/entity_epoch",parentData:data,parentDataProperty:"entity_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.entity_revision !== undefined && func0.call(data, "entity_revision")){
if(!(validate101.call(this, data.entity_revision, {instancePath:instancePath+"/entity_revision",parentData:data,parentDataProperty:"entity_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.view !== undefined && func0.call(data, "view")){
if(!(validate400.call(this, data.view, {instancePath:instancePath+"/view",parentData:data,parentDataProperty:"view",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate400.errors : vErrors.concat(validate400.errors);
errors = vErrors.length;
}
}
}
else {
const err95 = {instancePath,schemaPath:"#/oneOf/11/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
var _valid0 = _errs89 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 11];
}
else {
if(_valid0){
valid0 = true;
passing0 = 11;
if(props0 !== true){
props0 = true;
}
}
}
}
}
}
}
}
}
}
}
}
}
if(!valid0){
const err96 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
else {
errors = _errs0;
if(vErrors !== null){
if(_errs0){
vErrors.length = _errs0;
}
else {
vErrors = null;
}
}
}
validate164.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate164.evaluated = {"dynamicProps":true,"dynamicItems":false};

const schema101 = {"enum":["devices","catalogs","commands","controls","observations","sources","definitions","runs","business_states","executions","schedule_activations","occurrences"]};

function validate413(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate413.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!((((((((((((data === "devices") || (data === "catalogs")) || (data === "commands")) || (data === "controls")) || (data === "observations")) || (data === "sources")) || (data === "definitions")) || (data === "runs")) || (data === "business_states")) || (data === "executions")) || (data === "schedule_activations")) || (data === "occurrences"))){
const err0 = {instancePath,schemaPath:"#/enum",keyword:"enum",params:{allowedValues: schema101.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
validate413.errors = vErrors;
return errors === 0;
}
validate413.evaluated = {"dynamicProps":false,"dynamicItems":false};

const schema102 = {"type":"object","properties":{"source_key":{"$ref":"#/$defs/snapshot__SourceKey"},"event_id":{"$ref":"#/$defs/snapshot__Id"},"source_sequence":{"$ref":"#/$defs/snapshot__PositiveCounter"},"trigger_id":{"$ref":"#/$defs/snapshot__Id"},"capability_version":{"type":"string","minLength":1,"maxLength":64},"occurred_at":{"anyOf":[{"$ref":"#/$defs/snapshot__Timestamp"},{"type":"null"}]},"observed_at":{"$ref":"#/$defs/snapshot__Timestamp"},"origin_digest":{"$ref":"#/$defs/snapshot__Digest"},"age_evidence_ref":{"$ref":"#/$defs/snapshot__ObjectRef"},"payload":{"$ref":"#/$defs/snapshot__QualifiedValue"}},"required":["source_key","event_id","source_sequence","trigger_id","capability_version","occurred_at","observed_at","origin_digest","age_evidence_ref","payload"],"additionalProperties":false};
const schema103 = {"type":"string","pattern":"^[1-9][0-9]*(?![\\s\\S])","maxLength":20};
const pattern34 = new RegExp("^[1-9][0-9]*(?![\\s\\S])", "u");

function validate421(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate421.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func64(data) > 20){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 20},message:"must NOT have more than 20 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(!pattern34.test(data)){
const err1 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^[1-9][0-9]*(?![\\s\\S])"},message:"must match pattern \""+"^[1-9][0-9]*(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
else {
const err2 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
validate421.errors = vErrors;
return errors === 0;
}
validate421.evaluated = {"dynamicProps":false,"dynamicItems":false};


function validate418(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate418.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.source_key === undefined) || (!(func0.call(data, "source_key")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_key"},message:"must have required property '"+"source_key"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.event_id === undefined) || (!(func0.call(data, "event_id")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "event_id"},message:"must have required property '"+"event_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.source_sequence === undefined) || (!(func0.call(data, "source_sequence")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_sequence"},message:"must have required property '"+"source_sequence"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.trigger_id === undefined) || (!(func0.call(data, "trigger_id")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "trigger_id"},message:"must have required property '"+"trigger_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.capability_version === undefined) || (!(func0.call(data, "capability_version")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "capability_version"},message:"must have required property '"+"capability_version"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.occurred_at === undefined) || (!(func0.call(data, "occurred_at")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "occurred_at"},message:"must have required property '"+"occurred_at"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.observed_at === undefined) || (!(func0.call(data, "observed_at")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "observed_at"},message:"must have required property '"+"observed_at"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if((data.origin_digest === undefined) || (!(func0.call(data, "origin_digest")))){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "origin_digest"},message:"must have required property '"+"origin_digest"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if((data.age_evidence_ref === undefined) || (!(func0.call(data, "age_evidence_ref")))){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "age_evidence_ref"},message:"must have required property '"+"age_evidence_ref"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if((data.payload === undefined) || (!(func0.call(data, "payload")))){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "payload"},message:"must have required property '"+"payload"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(func0.call(schema102.properties, key0))){
const err10 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.source_key !== undefined && func0.call(data, "source_key")){
if(!(validate309.call(this, data.source_key, {instancePath:instancePath+"/source_key",parentData:data,parentDataProperty:"source_key",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate309.errors : vErrors.concat(validate309.errors);
errors = vErrors.length;
}
}
if(data.event_id !== undefined && func0.call(data, "event_id")){
if(!(validate93.call(this, data.event_id, {instancePath:instancePath+"/event_id",parentData:data,parentDataProperty:"event_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.source_sequence !== undefined && func0.call(data, "source_sequence")){
if(!(validate421.call(this, data.source_sequence, {instancePath:instancePath+"/source_sequence",parentData:data,parentDataProperty:"source_sequence",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate421.errors : vErrors.concat(validate421.errors);
errors = vErrors.length;
}
}
if(data.trigger_id !== undefined && func0.call(data, "trigger_id")){
if(!(validate93.call(this, data.trigger_id, {instancePath:instancePath+"/trigger_id",parentData:data,parentDataProperty:"trigger_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.capability_version !== undefined && func0.call(data, "capability_version")){
let data4 = data.capability_version;
if(typeof data4 === "string"){
if(func64(data4) > 64){
const err11 = {instancePath:instancePath+"/capability_version",schemaPath:"#/properties/capability_version/maxLength",keyword:"maxLength",params:{limit: 64},message:"must NOT have more than 64 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(func64(data4) < 1){
const err12 = {instancePath:instancePath+"/capability_version",schemaPath:"#/properties/capability_version/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
else {
const err13 = {instancePath:instancePath+"/capability_version",schemaPath:"#/properties/capability_version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.occurred_at !== undefined && func0.call(data, "occurred_at")){
let data5 = data.occurred_at;
const _errs9 = errors;
let valid1 = false;
const _errs10 = errors;
if(!(validate297.call(this, data5, {instancePath:instancePath+"/occurred_at",parentData:data,parentDataProperty:"occurred_at",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate297.errors : vErrors.concat(validate297.errors);
errors = vErrors.length;
}
var _valid0 = _errs10 === errors;
valid1 = valid1 || _valid0;
const _errs11 = errors;
if(data5 !== null){
const err14 = {instancePath:instancePath+"/occurred_at",schemaPath:"#/properties/occurred_at/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
var _valid0 = _errs11 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err15 = {instancePath:instancePath+"/occurred_at",schemaPath:"#/properties/occurred_at/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
else {
errors = _errs9;
if(vErrors !== null){
if(_errs9){
vErrors.length = _errs9;
}
else {
vErrors = null;
}
}
}
}
if(data.observed_at !== undefined && func0.call(data, "observed_at")){
if(!(validate297.call(this, data.observed_at, {instancePath:instancePath+"/observed_at",parentData:data,parentDataProperty:"observed_at",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate297.errors : vErrors.concat(validate297.errors);
errors = vErrors.length;
}
}
if(data.origin_digest !== undefined && func0.call(data, "origin_digest")){
if(!(validate99.call(this, data.origin_digest, {instancePath:instancePath+"/origin_digest",parentData:data,parentDataProperty:"origin_digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate99.errors : vErrors.concat(validate99.errors);
errors = vErrors.length;
}
}
if(data.age_evidence_ref !== undefined && func0.call(data, "age_evidence_ref")){
if(!(validate170.call(this, data.age_evidence_ref, {instancePath:instancePath+"/age_evidence_ref",parentData:data,parentDataProperty:"age_evidence_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
if(data.payload !== undefined && func0.call(data, "payload")){
if(!(validate320.call(this, data.payload, {instancePath:instancePath+"/payload",parentData:data,parentDataProperty:"payload",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate320.errors : vErrors.concat(validate320.errors);
errors = vErrors.length;
}
}
}
else {
const err16 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
validate418.errors = vErrors;
return errors === 0;
}
validate418.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate163(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate163.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs0 = errors;
let valid0 = false;
let passing0 = null;
const _errs1 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.entry_kind === undefined) || (!(func0.call(data, "entry_kind")))){
const err0 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "entry_kind"},message:"must have required property '"+"entry_kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.payload === undefined) || (!(func0.call(data, "payload")))){
const err1 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "payload"},message:"must have required property '"+"payload"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((key0 === "entry_kind") || (key0 === "payload"))){
const err2 = {instancePath,schemaPath:"#/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.entry_kind !== undefined && func0.call(data, "entry_kind")){
if("entity.upsert" !== data.entry_kind){
const err3 = {instancePath:instancePath+"/entry_kind",schemaPath:"#/oneOf/0/properties/entry_kind/const",keyword:"const",params:{allowedValue: "entity.upsert"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.payload !== undefined && func0.call(data, "payload")){
if(!(validate164.call(this, data.payload, {instancePath:instancePath+"/payload",parentData:data,parentDataProperty:"payload",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate164.errors : vErrors.concat(validate164.errors);
errors = vErrors.length;
}
}
}
else {
const err4 = {instancePath,schemaPath:"#/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props1 = true;
}
const _errs6 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.entry_kind === undefined) || (!(func0.call(data, "entry_kind")))){
const err5 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "entry_kind"},message:"must have required property '"+"entry_kind"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.payload === undefined) || (!(func0.call(data, "payload")))){
const err6 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "payload"},message:"must have required property '"+"payload"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key1 of Object.keys(data)){
if(!((key1 === "entry_kind") || (key1 === "payload"))){
const err7 = {instancePath,schemaPath:"#/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.entry_kind !== undefined && func0.call(data, "entry_kind")){
if("entity.remove" !== data.entry_kind){
const err8 = {instancePath:instancePath+"/entry_kind",schemaPath:"#/oneOf/1/properties/entry_kind/const",keyword:"const",params:{allowedValue: "entity.remove"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.payload !== undefined && func0.call(data, "payload")){
let data3 = data.payload;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if((data3.entity_kind === undefined) || (!(func0.call(data3, "entity_kind")))){
const err9 = {instancePath:instancePath+"/payload",schemaPath:"#/oneOf/1/properties/payload/required",keyword:"required",params:{missingProperty: "entity_kind"},message:"must have required property '"+"entity_kind"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if((data3.entity_id === undefined) || (!(func0.call(data3, "entity_id")))){
const err10 = {instancePath:instancePath+"/payload",schemaPath:"#/oneOf/1/properties/payload/required",keyword:"required",params:{missingProperty: "entity_id"},message:"must have required property '"+"entity_id"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if((data3.entity_epoch === undefined) || (!(func0.call(data3, "entity_epoch")))){
const err11 = {instancePath:instancePath+"/payload",schemaPath:"#/oneOf/1/properties/payload/required",keyword:"required",params:{missingProperty: "entity_epoch"},message:"must have required property '"+"entity_epoch"+"'"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if((data3.entity_revision === undefined) || (!(func0.call(data3, "entity_revision")))){
const err12 = {instancePath:instancePath+"/payload",schemaPath:"#/oneOf/1/properties/payload/required",keyword:"required",params:{missingProperty: "entity_revision"},message:"must have required property '"+"entity_revision"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if((data3.reason === undefined) || (!(func0.call(data3, "reason")))){
const err13 = {instancePath:instancePath+"/payload",schemaPath:"#/oneOf/1/properties/payload/required",keyword:"required",params:{missingProperty: "reason"},message:"must have required property '"+"reason"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
for(const key2 of Object.keys(data3)){
if(!(((((key2 === "entity_kind") || (key2 === "entity_id")) || (key2 === "entity_epoch")) || (key2 === "entity_revision")) || (key2 === "reason"))){
const err14 = {instancePath:instancePath+"/payload",schemaPath:"#/oneOf/1/properties/payload/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data3.entity_kind !== undefined && func0.call(data3, "entity_kind")){
if(!(validate413.call(this, data3.entity_kind, {instancePath:instancePath+"/payload/entity_kind",parentData:data3,parentDataProperty:"entity_kind",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate413.errors : vErrors.concat(validate413.errors);
errors = vErrors.length;
}
}
if(data3.entity_id !== undefined && func0.call(data3, "entity_id")){
if(!(validate93.call(this, data3.entity_id, {instancePath:instancePath+"/payload/entity_id",parentData:data3,parentDataProperty:"entity_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data3.entity_epoch !== undefined && func0.call(data3, "entity_epoch")){
if(!(validate93.call(this, data3.entity_epoch, {instancePath:instancePath+"/payload/entity_epoch",parentData:data3,parentDataProperty:"entity_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data3.entity_revision !== undefined && func0.call(data3, "entity_revision")){
if(!(validate101.call(this, data3.entity_revision, {instancePath:instancePath+"/payload/entity_revision",parentData:data3,parentDataProperty:"entity_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data3.reason !== undefined && func0.call(data3, "reason")){
let data8 = data3.reason;
if(!((data8 === "deleted") || (data8 === "left_scope"))){
const err15 = {instancePath:instancePath+"/payload/reason",schemaPath:"#/oneOf/1/properties/payload/properties/reason/enum",keyword:"enum",params:{allowedValues: schema47.oneOf[1].properties.payload.properties.reason.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
}
else {
const err16 = {instancePath:instancePath+"/payload",schemaPath:"#/oneOf/1/properties/payload/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
}
else {
const err17 = {instancePath,schemaPath:"#/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
var _valid0 = _errs6 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid0 = true;
passing0 = 1;
if(props1 !== true){
props1 = true;
}
}
const _errs18 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.entry_kind === undefined) || (!(func0.call(data, "entry_kind")))){
const err18 = {instancePath,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty: "entry_kind"},message:"must have required property '"+"entry_kind"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if((data.payload === undefined) || (!(func0.call(data, "payload")))){
const err19 = {instancePath,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty: "payload"},message:"must have required property '"+"payload"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
for(const key3 of Object.keys(data)){
if(!((key3 === "entry_kind") || (key3 === "payload"))){
const err20 = {instancePath,schemaPath:"#/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data.entry_kind !== undefined && func0.call(data, "entry_kind")){
if("source.event" !== data.entry_kind){
const err21 = {instancePath:instancePath+"/entry_kind",schemaPath:"#/oneOf/2/properties/entry_kind/const",keyword:"const",params:{allowedValue: "source.event"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.payload !== undefined && func0.call(data, "payload")){
if(!(validate418.call(this, data.payload, {instancePath:instancePath+"/payload",parentData:data,parentDataProperty:"payload",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate418.errors : vErrors.concat(validate418.errors);
errors = vErrors.length;
}
}
}
else {
const err22 = {instancePath,schemaPath:"#/oneOf/2/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
var _valid0 = _errs18 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid0 = true;
passing0 = 2;
if(props1 !== true){
props1 = true;
}
}
}
}
if(!valid0){
const err23 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
else {
errors = _errs0;
if(vErrors !== null){
if(_errs0){
vErrors.length = _errs0;
}
else {
vErrors = null;
}
}
}
validate163.errors = vErrors;
evaluated0.props = props1;
return errors === 0;
}
validate163.evaluated = {"dynamicProps":true,"dynamicItems":false};


function validate150(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate150.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.format_version === undefined) || (!(func0.call(data, "format_version")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "format_version"},message:"must have required property '"+"format_version"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.type === undefined) || (!(func0.call(data, "type")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.binding === undefined) || (!(func0.call(data, "binding")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "binding"},message:"must have required property '"+"binding"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.cursor === undefined) || (!(func0.call(data, "cursor")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "cursor"},message:"must have required property '"+"cursor"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.previous_cursor === undefined) || (!(func0.call(data, "previous_cursor")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "previous_cursor"},message:"must have required property '"+"previous_cursor"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.delivery_mode === undefined) || (!(func0.call(data, "delivery_mode")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "delivery_mode"},message:"must have required property '"+"delivery_mode"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.entry === undefined) || (!(func0.call(data, "entry")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "entry"},message:"must have required property '"+"entry"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if((data.payload_digest === undefined) || (!(func0.call(data, "payload_digest")))){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "payload_digest"},message:"must have required property '"+"payload_digest"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((((((((key0 === "format_version") || (key0 === "type")) || (key0 === "binding")) || (key0 === "cursor")) || (key0 === "previous_cursor")) || (key0 === "delivery_mode")) || (key0 === "entry")) || (key0 === "payload_digest"))){
const err8 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.format_version !== undefined && func0.call(data, "format_version")){
if("snapshot-projection/0.2.0-draft.1" !== data.format_version){
const err9 = {instancePath:instancePath+"/format_version",schemaPath:"#/properties/format_version/const",keyword:"const",params:{allowedValue: "snapshot-projection/0.2.0-draft.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.type !== undefined && func0.call(data, "type")){
if("server.data" !== data.type){
const err10 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/const",keyword:"const",params:{allowedValue: "server.data"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.binding !== undefined && func0.call(data, "binding")){
if(!(validate151.call(this, data.binding, {instancePath:instancePath+"/binding",parentData:data,parentDataProperty:"binding",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate151.errors : vErrors.concat(validate151.errors);
errors = vErrors.length;
}
}
if(data.cursor !== undefined && func0.call(data, "cursor")){
if(!(validate101.call(this, data.cursor, {instancePath:instancePath+"/cursor",parentData:data,parentDataProperty:"cursor",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.previous_cursor !== undefined && func0.call(data, "previous_cursor")){
if(!(validate101.call(this, data.previous_cursor, {instancePath:instancePath+"/previous_cursor",parentData:data,parentDataProperty:"previous_cursor",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.delivery_mode !== undefined && func0.call(data, "delivery_mode")){
let data5 = data.delivery_mode;
if(!((data5 === "live") || (data5 === "reconcile"))){
const err11 = {instancePath:instancePath+"/delivery_mode",schemaPath:"#/properties/delivery_mode/enum",keyword:"enum",params:{allowedValues: schema45.properties.delivery_mode.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.entry !== undefined && func0.call(data, "entry")){
if(!(validate163.call(this, data.entry, {instancePath:instancePath+"/entry",parentData:data,parentDataProperty:"entry",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate163.errors : vErrors.concat(validate163.errors);
errors = vErrors.length;
}
}
if(data.payload_digest !== undefined && func0.call(data, "payload_digest")){
if(!(validate99.call(this, data.payload_digest, {instancePath:instancePath+"/payload_digest",parentData:data,parentDataProperty:"payload_digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate99.errors : vErrors.concat(validate99.errors);
errors = vErrors.length;
}
}
}
else {
const err12 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
validate150.errors = vErrors;
return errors === 0;
}
validate150.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate117(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate117.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs0 = errors;
let valid0 = false;
let passing0 = null;
const _errs1 = errors;
if(!(validate118.call(this, data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate118.errors : vErrors.concat(validate118.errors);
errors = vErrors.length;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs2 = errors;
if(!(validate133.call(this, data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate133.errors : vErrors.concat(validate133.errors);
errors = vErrors.length;
}
var _valid0 = _errs2 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid0 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
const _errs3 = errors;
if(!(validate139.call(this, data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate139.errors : vErrors.concat(validate139.errors);
errors = vErrors.length;
}
var _valid0 = _errs3 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid0 = true;
passing0 = 2;
if(props0 !== true){
props0 = true;
}
}
const _errs4 = errors;
if(!(validate146.call(this, data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate146.errors : vErrors.concat(validate146.errors);
errors = vErrors.length;
}
var _valid0 = _errs4 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid0 = true;
passing0 = 3;
if(props0 !== true){
props0 = true;
}
}
const _errs5 = errors;
if(!(validate150.call(this, data, {instancePath,parentData,parentDataProperty,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate150.errors : vErrors.concat(validate150.errors);
errors = vErrors.length;
}
var _valid0 = _errs5 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 4];
}
else {
if(_valid0){
valid0 = true;
passing0 = 4;
if(props0 !== true){
props0 = true;
}
}
}
}
}
}
if(!valid0){
const err0 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
else {
errors = _errs0;
if(vErrors !== null){
if(_errs0){
vErrors.length = _errs0;
}
else {
vErrors = null;
}
}
}
validate117.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate117.evaluated = {"dynamicProps":true,"dynamicItems":false};

export const snapshot_manifest = validate433;
const schema104 = {"type":"object","properties":{"format_version":{"const":"snapshot-projection/0.2.0-draft.1"},"binding":{"$ref":"#/$defs/snapshot__ContentBinding"},"snapshot_cursor":{"$ref":"#/$defs/snapshot__Counter"},"collections":{"type":"array","items":{"$ref":"#/$defs/snapshot__Collection"},"maxItems":12},"source_watermarks":{"type":"array","items":{"$ref":"#/$defs/snapshot__Watermark"},"maxItems":256},"pages":{"type":"array","items":{"$ref":"#/$defs/snapshot__PageDescriptor"},"maxItems":128},"page_count":{"type":"integer","minimum":1,"maximum":128,"xRawInteger":true},"total_content_bytes":{"type":"integer","minimum":0,"maximum":8388608,"xRawInteger":true},"created_at":{"$ref":"#/$defs/snapshot__Timestamp"},"expires_at":{"$ref":"#/$defs/snapshot__Timestamp"},"manifest_digest":{"$ref":"#/$defs/snapshot__Digest"}},"required":["format_version","binding","snapshot_cursor","collections","source_watermarks","pages","page_count","total_content_bytes","created_at","expires_at","manifest_digest"],"additionalProperties":false};
const schema105 = {"type":"object","properties":{"snapshot_id":{"$ref":"#/$defs/snapshot__Id"},"subscription_id":{"$ref":"#/$defs/snapshot__Id"},"publisher_service_id":{"$ref":"#/$defs/snapshot__Id"},"publisher_database_instance_id":{"$ref":"#/$defs/snapshot__Id"},"stream_id":{"$ref":"#/$defs/snapshot__Id"},"stream_epoch":{"$ref":"#/$defs/snapshot__Id"},"scope_digest":{"$ref":"#/$defs/snapshot__Digest"},"authorization_revision":{"$ref":"#/$defs/snapshot__Counter"},"projection_profile_ref":{"$ref":"#/$defs/snapshot__ObjectRef"},"publisher_domain_ref":{"$ref":"#/$defs/snapshot__DomainRef"}},"required":["snapshot_id","subscription_id","publisher_service_id","publisher_database_instance_id","stream_id","stream_epoch","scope_digest","authorization_revision","projection_profile_ref","publisher_domain_ref"],"additionalProperties":false};
const schema106 = {"type":"object","properties":{"clock_domain_id":{"type":"string","pattern":"^clock_[0-9a-f]{64}(?![\\s\\S])"},"descriptor_digest":{"type":"string","pattern":"^sha256:[0-9a-f]{64}(?![\\s\\S])"}},"required":["clock_domain_id","descriptor_digest"],"additionalProperties":false};
const pattern35 = new RegExp("^clock_[0-9a-f]{64}(?![\\s\\S])", "u");

function validate444(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate444.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.clock_domain_id === undefined) || (!(func0.call(data, "clock_domain_id")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "clock_domain_id"},message:"must have required property '"+"clock_domain_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.descriptor_digest === undefined) || (!(func0.call(data, "descriptor_digest")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "descriptor_digest"},message:"must have required property '"+"descriptor_digest"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((key0 === "clock_domain_id") || (key0 === "descriptor_digest"))){
const err2 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.clock_domain_id !== undefined && func0.call(data, "clock_domain_id")){
let data0 = data.clock_domain_id;
if(typeof data0 === "string"){
if(!pattern35.test(data0)){
const err3 = {instancePath:instancePath+"/clock_domain_id",schemaPath:"#/properties/clock_domain_id/pattern",keyword:"pattern",params:{pattern: "^clock_[0-9a-f]{64}(?![\\s\\S])"},message:"must match pattern \""+"^clock_[0-9a-f]{64}(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
else {
const err4 = {instancePath:instancePath+"/clock_domain_id",schemaPath:"#/properties/clock_domain_id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.descriptor_digest !== undefined && func0.call(data, "descriptor_digest")){
let data1 = data.descriptor_digest;
if(typeof data1 === "string"){
if(!pattern15.test(data1)){
const err5 = {instancePath:instancePath+"/descriptor_digest",schemaPath:"#/properties/descriptor_digest/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}(?![\\s\\S])"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}(?![\\s\\S])"+"\""};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
else {
const err6 = {instancePath:instancePath+"/descriptor_digest",schemaPath:"#/properties/descriptor_digest/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
}
else {
const err7 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
validate444.errors = vErrors;
return errors === 0;
}
validate444.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate434(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate434.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.snapshot_id === undefined) || (!(func0.call(data, "snapshot_id")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot_id"},message:"must have required property '"+"snapshot_id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.subscription_id === undefined) || (!(func0.call(data, "subscription_id")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "subscription_id"},message:"must have required property '"+"subscription_id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.publisher_service_id === undefined) || (!(func0.call(data, "publisher_service_id")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publisher_service_id"},message:"must have required property '"+"publisher_service_id"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.publisher_database_instance_id === undefined) || (!(func0.call(data, "publisher_database_instance_id")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publisher_database_instance_id"},message:"must have required property '"+"publisher_database_instance_id"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.stream_id === undefined) || (!(func0.call(data, "stream_id")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stream_id"},message:"must have required property '"+"stream_id"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.stream_epoch === undefined) || (!(func0.call(data, "stream_epoch")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "stream_epoch"},message:"must have required property '"+"stream_epoch"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.scope_digest === undefined) || (!(func0.call(data, "scope_digest")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scope_digest"},message:"must have required property '"+"scope_digest"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if((data.authorization_revision === undefined) || (!(func0.call(data, "authorization_revision")))){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "authorization_revision"},message:"must have required property '"+"authorization_revision"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if((data.projection_profile_ref === undefined) || (!(func0.call(data, "projection_profile_ref")))){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "projection_profile_ref"},message:"must have required property '"+"projection_profile_ref"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if((data.publisher_domain_ref === undefined) || (!(func0.call(data, "publisher_domain_ref")))){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "publisher_domain_ref"},message:"must have required property '"+"publisher_domain_ref"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(func0.call(schema105.properties, key0))){
const err10 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.snapshot_id !== undefined && func0.call(data, "snapshot_id")){
if(!(validate93.call(this, data.snapshot_id, {instancePath:instancePath+"/snapshot_id",parentData:data,parentDataProperty:"snapshot_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.subscription_id !== undefined && func0.call(data, "subscription_id")){
if(!(validate93.call(this, data.subscription_id, {instancePath:instancePath+"/subscription_id",parentData:data,parentDataProperty:"subscription_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.publisher_service_id !== undefined && func0.call(data, "publisher_service_id")){
if(!(validate93.call(this, data.publisher_service_id, {instancePath:instancePath+"/publisher_service_id",parentData:data,parentDataProperty:"publisher_service_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.publisher_database_instance_id !== undefined && func0.call(data, "publisher_database_instance_id")){
if(!(validate93.call(this, data.publisher_database_instance_id, {instancePath:instancePath+"/publisher_database_instance_id",parentData:data,parentDataProperty:"publisher_database_instance_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.stream_id !== undefined && func0.call(data, "stream_id")){
if(!(validate93.call(this, data.stream_id, {instancePath:instancePath+"/stream_id",parentData:data,parentDataProperty:"stream_id",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.stream_epoch !== undefined && func0.call(data, "stream_epoch")){
if(!(validate93.call(this, data.stream_epoch, {instancePath:instancePath+"/stream_epoch",parentData:data,parentDataProperty:"stream_epoch",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
errors = vErrors.length;
}
}
if(data.scope_digest !== undefined && func0.call(data, "scope_digest")){
if(!(validate99.call(this, data.scope_digest, {instancePath:instancePath+"/scope_digest",parentData:data,parentDataProperty:"scope_digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate99.errors : vErrors.concat(validate99.errors);
errors = vErrors.length;
}
}
if(data.authorization_revision !== undefined && func0.call(data, "authorization_revision")){
if(!(validate101.call(this, data.authorization_revision, {instancePath:instancePath+"/authorization_revision",parentData:data,parentDataProperty:"authorization_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.projection_profile_ref !== undefined && func0.call(data, "projection_profile_ref")){
if(!(validate170.call(this, data.projection_profile_ref, {instancePath:instancePath+"/projection_profile_ref",parentData:data,parentDataProperty:"projection_profile_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
if(data.publisher_domain_ref !== undefined && func0.call(data, "publisher_domain_ref")){
if(!(validate444.call(this, data.publisher_domain_ref, {instancePath:instancePath+"/publisher_domain_ref",parentData:data,parentDataProperty:"publisher_domain_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate444.errors : vErrors.concat(validate444.errors);
errors = vErrors.length;
}
}
}
else {
const err11 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
validate434.errors = vErrors;
return errors === 0;
}
validate434.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema107 = {"type":"object","properties":{"entity_kind":{"$ref":"#/$defs/snapshot__EntityKind"},"count":{"$ref":"#/$defs/snapshot__Counter"},"view_schema_ref":{"$ref":"#/$defs/snapshot__SchemaRef"}},"required":["entity_kind","count","view_schema_ref"],"additionalProperties":false};

function validate448(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate448.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.entity_kind === undefined) || (!(func0.call(data, "entity_kind")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "entity_kind"},message:"must have required property '"+"entity_kind"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.count === undefined) || (!(func0.call(data, "count")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "count"},message:"must have required property '"+"count"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.view_schema_ref === undefined) || (!(func0.call(data, "view_schema_ref")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "view_schema_ref"},message:"must have required property '"+"view_schema_ref"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(((key0 === "entity_kind") || (key0 === "count")) || (key0 === "view_schema_ref"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.entity_kind !== undefined && func0.call(data, "entity_kind")){
if(!(validate413.call(this, data.entity_kind, {instancePath:instancePath+"/entity_kind",parentData:data,parentDataProperty:"entity_kind",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate413.errors : vErrors.concat(validate413.errors);
errors = vErrors.length;
}
}
if(data.count !== undefined && func0.call(data, "count")){
if(!(validate101.call(this, data.count, {instancePath:instancePath+"/count",parentData:data,parentDataProperty:"count",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.view_schema_ref !== undefined && func0.call(data, "view_schema_ref")){
if(!(validate321.call(this, data.view_schema_ref, {instancePath:instancePath+"/view_schema_ref",parentData:data,parentDataProperty:"view_schema_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate321.errors : vErrors.concat(validate321.errors);
errors = vErrors.length;
}
}
}
else {
const err4 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
validate448.errors = vErrors;
return errors === 0;
}
validate448.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema108 = {"type":"object","properties":{"source_key":{"$ref":"#/$defs/snapshot__SourceKey"},"binding_ref":{"$ref":"#/$defs/snapshot__ObjectRef"},"baseline_sequence":{"$ref":"#/$defs/snapshot__Counter"},"source_state_revision":{"$ref":"#/$defs/snapshot__Counter"},"baseline_ref":{"anyOf":[{"$ref":"#/$defs/snapshot__ObjectRef"},{"type":"null"}]},"gap_summary":{"type":"array","items":{"$ref":"#/$defs/snapshot__Gap"},"maxItems":64}},"required":["source_key","binding_ref","baseline_sequence","source_state_revision","baseline_ref","gap_summary"],"additionalProperties":false};

function validate453(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate453.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.source_key === undefined) || (!(func0.call(data, "source_key")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_key"},message:"must have required property '"+"source_key"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.binding_ref === undefined) || (!(func0.call(data, "binding_ref")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "binding_ref"},message:"must have required property '"+"binding_ref"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.baseline_sequence === undefined) || (!(func0.call(data, "baseline_sequence")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "baseline_sequence"},message:"must have required property '"+"baseline_sequence"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.source_state_revision === undefined) || (!(func0.call(data, "source_state_revision")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_state_revision"},message:"must have required property '"+"source_state_revision"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.baseline_ref === undefined) || (!(func0.call(data, "baseline_ref")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "baseline_ref"},message:"must have required property '"+"baseline_ref"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.gap_summary === undefined) || (!(func0.call(data, "gap_summary")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "gap_summary"},message:"must have required property '"+"gap_summary"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((((((key0 === "source_key") || (key0 === "binding_ref")) || (key0 === "baseline_sequence")) || (key0 === "source_state_revision")) || (key0 === "baseline_ref")) || (key0 === "gap_summary"))){
const err6 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.source_key !== undefined && func0.call(data, "source_key")){
if(!(validate309.call(this, data.source_key, {instancePath:instancePath+"/source_key",parentData:data,parentDataProperty:"source_key",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate309.errors : vErrors.concat(validate309.errors);
errors = vErrors.length;
}
}
if(data.binding_ref !== undefined && func0.call(data, "binding_ref")){
if(!(validate170.call(this, data.binding_ref, {instancePath:instancePath+"/binding_ref",parentData:data,parentDataProperty:"binding_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
}
if(data.baseline_sequence !== undefined && func0.call(data, "baseline_sequence")){
if(!(validate101.call(this, data.baseline_sequence, {instancePath:instancePath+"/baseline_sequence",parentData:data,parentDataProperty:"baseline_sequence",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.source_state_revision !== undefined && func0.call(data, "source_state_revision")){
if(!(validate101.call(this, data.source_state_revision, {instancePath:instancePath+"/source_state_revision",parentData:data,parentDataProperty:"source_state_revision",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.baseline_ref !== undefined && func0.call(data, "baseline_ref")){
let data4 = data.baseline_ref;
const _errs7 = errors;
let valid1 = false;
const _errs8 = errors;
if(!(validate170.call(this, data4, {instancePath:instancePath+"/baseline_ref",parentData:data,parentDataProperty:"baseline_ref",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate170.errors : vErrors.concat(validate170.errors);
errors = vErrors.length;
}
var _valid0 = _errs8 === errors;
valid1 = valid1 || _valid0;
const _errs9 = errors;
if(data4 !== null){
const err7 = {instancePath:instancePath+"/baseline_ref",schemaPath:"#/properties/baseline_ref/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
var _valid0 = _errs9 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err8 = {instancePath:instancePath+"/baseline_ref",schemaPath:"#/properties/baseline_ref/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
else {
errors = _errs7;
if(vErrors !== null){
if(_errs7){
vErrors.length = _errs7;
}
else {
vErrors = null;
}
}
}
}
if(data.gap_summary !== undefined && func0.call(data, "gap_summary")){
let data5 = data.gap_summary;
if(Array.isArray(data5)){
if(data5.length > 64){
const err9 = {instancePath:instancePath+"/gap_summary",schemaPath:"#/properties/gap_summary/maxItems",keyword:"maxItems",params:{limit: 64},message:"must NOT have more than 64 items"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
const len0 = data5.length;
for(let i0=0; i0<len0; i0++){
if(!(validate336.call(this, data5[i0], {instancePath:instancePath+"/gap_summary/" + i0,parentData:data5,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate336.errors : vErrors.concat(validate336.errors);
errors = vErrors.length;
}
}
}
else {
const err10 = {instancePath:instancePath+"/gap_summary",schemaPath:"#/properties/gap_summary/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
else {
const err11 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
validate453.errors = vErrors;
return errors === 0;
}
validate453.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema109 = {"type":"object","properties":{"page_index":{"type":"integer","minimum":0,"maximum":127,"xRawInteger":true},"content_bytes":{"type":"integer","minimum":0,"maximum":245760,"xRawInteger":true},"content_digest":{"$ref":"#/$defs/snapshot__Digest"}},"required":["page_index","content_bytes","content_digest"],"additionalProperties":false};

function validate461(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate461.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.page_index === undefined) || (!(func0.call(data, "page_index")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "page_index"},message:"must have required property '"+"page_index"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.content_bytes === undefined) || (!(func0.call(data, "content_bytes")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "content_bytes"},message:"must have required property '"+"content_bytes"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.content_digest === undefined) || (!(func0.call(data, "content_digest")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "content_digest"},message:"must have required property '"+"content_digest"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(((key0 === "page_index") || (key0 === "content_bytes")) || (key0 === "content_digest"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.page_index !== undefined && func0.call(data, "page_index")){
let data0 = data.page_index;
if(!((typeof data0 == "number") && (!(data0 % 1) && !isNaN(data0)))){
const err4 = {instancePath:instancePath+"/page_index",schemaPath:"#/properties/page_index/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(typeof data0 == "number"){
if(data0 > 127 || isNaN(data0)){
const err5 = {instancePath:instancePath+"/page_index",schemaPath:"#/properties/page_index/maximum",keyword:"maximum",params:{comparison: "<=", limit: 127},message:"must be <= 127"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data0 < 0 || isNaN(data0)){
const err6 = {instancePath:instancePath+"/page_index",schemaPath:"#/properties/page_index/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
const rawToken0 = this && this.numbers && this.numbers.get(instancePath + "/page_index");
if(!rawToken0 || !rawToken0.integer || !rawToken0.safe){
const err7 = {instancePath:instancePath+"/page_index",schemaPath:"#/properties/page_index/xRawInteger",keyword:"xRawInteger",params:{},message:"must pass \"xRawInteger\" keyword validation"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
if(data.content_bytes !== undefined && func0.call(data, "content_bytes")){
let data1 = data.content_bytes;
if(!((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1)))){
const err8 = {instancePath:instancePath+"/content_bytes",schemaPath:"#/properties/content_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(typeof data1 == "number"){
if(data1 > 245760 || isNaN(data1)){
const err9 = {instancePath:instancePath+"/content_bytes",schemaPath:"#/properties/content_bytes/maximum",keyword:"maximum",params:{comparison: "<=", limit: 245760},message:"must be <= 245760"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data1 < 0 || isNaN(data1)){
const err10 = {instancePath:instancePath+"/content_bytes",schemaPath:"#/properties/content_bytes/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
const rawToken1 = this && this.numbers && this.numbers.get(instancePath + "/content_bytes");
if(!rawToken1 || !rawToken1.integer || !rawToken1.safe){
const err11 = {instancePath:instancePath+"/content_bytes",schemaPath:"#/properties/content_bytes/xRawInteger",keyword:"xRawInteger",params:{},message:"must pass \"xRawInteger\" keyword validation"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
if(data.content_digest !== undefined && func0.call(data, "content_digest")){
if(!(validate99.call(this, data.content_digest, {instancePath:instancePath+"/content_digest",parentData:data,parentDataProperty:"content_digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate99.errors : vErrors.concat(validate99.errors);
errors = vErrors.length;
}
}
}
else {
const err12 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
validate461.errors = vErrors;
return errors === 0;
}
validate461.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate433(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate433.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.format_version === undefined) || (!(func0.call(data, "format_version")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "format_version"},message:"must have required property '"+"format_version"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.binding === undefined) || (!(func0.call(data, "binding")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "binding"},message:"must have required property '"+"binding"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.snapshot_cursor === undefined) || (!(func0.call(data, "snapshot_cursor")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "snapshot_cursor"},message:"must have required property '"+"snapshot_cursor"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.collections === undefined) || (!(func0.call(data, "collections")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "collections"},message:"must have required property '"+"collections"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.source_watermarks === undefined) || (!(func0.call(data, "source_watermarks")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "source_watermarks"},message:"must have required property '"+"source_watermarks"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if((data.pages === undefined) || (!(func0.call(data, "pages")))){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "pages"},message:"must have required property '"+"pages"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if((data.page_count === undefined) || (!(func0.call(data, "page_count")))){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "page_count"},message:"must have required property '"+"page_count"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if((data.total_content_bytes === undefined) || (!(func0.call(data, "total_content_bytes")))){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "total_content_bytes"},message:"must have required property '"+"total_content_bytes"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if((data.created_at === undefined) || (!(func0.call(data, "created_at")))){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "created_at"},message:"must have required property '"+"created_at"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if((data.expires_at === undefined) || (!(func0.call(data, "expires_at")))){
const err9 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "expires_at"},message:"must have required property '"+"expires_at"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if((data.manifest_digest === undefined) || (!(func0.call(data, "manifest_digest")))){
const err10 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "manifest_digest"},message:"must have required property '"+"manifest_digest"+"'"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(func0.call(schema104.properties, key0))){
const err11 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.format_version !== undefined && func0.call(data, "format_version")){
if("snapshot-projection/0.2.0-draft.1" !== data.format_version){
const err12 = {instancePath:instancePath+"/format_version",schemaPath:"#/properties/format_version/const",keyword:"const",params:{allowedValue: "snapshot-projection/0.2.0-draft.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.binding !== undefined && func0.call(data, "binding")){
if(!(validate434.call(this, data.binding, {instancePath:instancePath+"/binding",parentData:data,parentDataProperty:"binding",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate434.errors : vErrors.concat(validate434.errors);
errors = vErrors.length;
}
}
if(data.snapshot_cursor !== undefined && func0.call(data, "snapshot_cursor")){
if(!(validate101.call(this, data.snapshot_cursor, {instancePath:instancePath+"/snapshot_cursor",parentData:data,parentDataProperty:"snapshot_cursor",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate101.errors : vErrors.concat(validate101.errors);
errors = vErrors.length;
}
}
if(data.collections !== undefined && func0.call(data, "collections")){
let data3 = data.collections;
if(Array.isArray(data3)){
if(data3.length > 12){
const err13 = {instancePath:instancePath+"/collections",schemaPath:"#/properties/collections/maxItems",keyword:"maxItems",params:{limit: 12},message:"must NOT have more than 12 items"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
const len0 = data3.length;
for(let i0=0; i0<len0; i0++){
if(!(validate448.call(this, data3[i0], {instancePath:instancePath+"/collections/" + i0,parentData:data3,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate448.errors : vErrors.concat(validate448.errors);
errors = vErrors.length;
}
}
}
else {
const err14 = {instancePath:instancePath+"/collections",schemaPath:"#/properties/collections/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.source_watermarks !== undefined && func0.call(data, "source_watermarks")){
let data5 = data.source_watermarks;
if(Array.isArray(data5)){
if(data5.length > 256){
const err15 = {instancePath:instancePath+"/source_watermarks",schemaPath:"#/properties/source_watermarks/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
const len1 = data5.length;
for(let i1=0; i1<len1; i1++){
if(!(validate453.call(this, data5[i1], {instancePath:instancePath+"/source_watermarks/" + i1,parentData:data5,parentDataProperty:i1,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate453.errors : vErrors.concat(validate453.errors);
errors = vErrors.length;
}
}
}
else {
const err16 = {instancePath:instancePath+"/source_watermarks",schemaPath:"#/properties/source_watermarks/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data.pages !== undefined && func0.call(data, "pages")){
let data7 = data.pages;
if(Array.isArray(data7)){
if(data7.length > 128){
const err17 = {instancePath:instancePath+"/pages",schemaPath:"#/properties/pages/maxItems",keyword:"maxItems",params:{limit: 128},message:"must NOT have more than 128 items"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
const len2 = data7.length;
for(let i2=0; i2<len2; i2++){
if(!(validate461.call(this, data7[i2], {instancePath:instancePath+"/pages/" + i2,parentData:data7,parentDataProperty:i2,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate461.errors : vErrors.concat(validate461.errors);
errors = vErrors.length;
}
}
}
else {
const err18 = {instancePath:instancePath+"/pages",schemaPath:"#/properties/pages/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.page_count !== undefined && func0.call(data, "page_count")){
let data9 = data.page_count;
if(!((typeof data9 == "number") && (!(data9 % 1) && !isNaN(data9)))){
const err19 = {instancePath:instancePath+"/page_count",schemaPath:"#/properties/page_count/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(typeof data9 == "number"){
if(data9 > 128 || isNaN(data9)){
const err20 = {instancePath:instancePath+"/page_count",schemaPath:"#/properties/page_count/maximum",keyword:"maximum",params:{comparison: "<=", limit: 128},message:"must be <= 128"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data9 < 1 || isNaN(data9)){
const err21 = {instancePath:instancePath+"/page_count",schemaPath:"#/properties/page_count/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
const rawToken0 = this && this.numbers && this.numbers.get(instancePath + "/page_count");
if(!rawToken0 || !rawToken0.integer || !rawToken0.safe){
const err22 = {instancePath:instancePath+"/page_count",schemaPath:"#/properties/page_count/xRawInteger",keyword:"xRawInteger",params:{},message:"must pass \"xRawInteger\" keyword validation"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
}
if(data.total_content_bytes !== undefined && func0.call(data, "total_content_bytes")){
let data10 = data.total_content_bytes;
if(!((typeof data10 == "number") && (!(data10 % 1) && !isNaN(data10)))){
const err23 = {instancePath:instancePath+"/total_content_bytes",schemaPath:"#/properties/total_content_bytes/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(typeof data10 == "number"){
if(data10 > 8388608 || isNaN(data10)){
const err24 = {instancePath:instancePath+"/total_content_bytes",schemaPath:"#/properties/total_content_bytes/maximum",keyword:"maximum",params:{comparison: "<=", limit: 8388608},message:"must be <= 8388608"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(data10 < 0 || isNaN(data10)){
const err25 = {instancePath:instancePath+"/total_content_bytes",schemaPath:"#/properties/total_content_bytes/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
const rawToken1 = this && this.numbers && this.numbers.get(instancePath + "/total_content_bytes");
if(!rawToken1 || !rawToken1.integer || !rawToken1.safe){
const err26 = {instancePath:instancePath+"/total_content_bytes",schemaPath:"#/properties/total_content_bytes/xRawInteger",keyword:"xRawInteger",params:{},message:"must pass \"xRawInteger\" keyword validation"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
}
if(data.created_at !== undefined && func0.call(data, "created_at")){
if(!(validate297.call(this, data.created_at, {instancePath:instancePath+"/created_at",parentData:data,parentDataProperty:"created_at",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate297.errors : vErrors.concat(validate297.errors);
errors = vErrors.length;
}
}
if(data.expires_at !== undefined && func0.call(data, "expires_at")){
if(!(validate297.call(this, data.expires_at, {instancePath:instancePath+"/expires_at",parentData:data,parentDataProperty:"expires_at",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate297.errors : vErrors.concat(validate297.errors);
errors = vErrors.length;
}
}
if(data.manifest_digest !== undefined && func0.call(data, "manifest_digest")){
if(!(validate99.call(this, data.manifest_digest, {instancePath:instancePath+"/manifest_digest",parentData:data,parentDataProperty:"manifest_digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate99.errors : vErrors.concat(validate99.errors);
errors = vErrors.length;
}
}
}
else {
const err27 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
validate433.errors = vErrors;
return errors === 0;
}
validate433.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

export const snapshot_page = validate467;
const schema110 = {"type":"object","properties":{"manifest_digest":{"$ref":"#/$defs/snapshot__Digest"},"content_digest":{"$ref":"#/$defs/snapshot__Digest"},"content":{"$ref":"#/$defs/snapshot__PageContent"},"delivery_binding":{"$ref":"#/$defs/snapshot__DeliveryBinding"}},"required":["manifest_digest","content_digest","content","delivery_binding"],"additionalProperties":false};
const schema111 = {"type":"object","properties":{"format_version":{"const":"snapshot-projection/0.2.0-draft.1"},"binding":{"$ref":"#/$defs/snapshot__ContentBinding"},"page_index":{"type":"integer","minimum":0,"maximum":127,"xRawInteger":true},"next_page_index":{"anyOf":[{"type":"integer","minimum":0,"maximum":127,"xRawInteger":true},{"type":"null"}]},"records":{"type":"array","items":{"$ref":"#/$defs/snapshot__Record"},"maxItems":256}},"required":["format_version","binding","page_index","next_page_index","records"],"additionalProperties":false};

function validate470(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate470.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.format_version === undefined) || (!(func0.call(data, "format_version")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "format_version"},message:"must have required property '"+"format_version"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.binding === undefined) || (!(func0.call(data, "binding")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "binding"},message:"must have required property '"+"binding"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.page_index === undefined) || (!(func0.call(data, "page_index")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "page_index"},message:"must have required property '"+"page_index"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.next_page_index === undefined) || (!(func0.call(data, "next_page_index")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "next_page_index"},message:"must have required property '"+"next_page_index"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if((data.records === undefined) || (!(func0.call(data, "records")))){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "records"},message:"must have required property '"+"records"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!(((((key0 === "format_version") || (key0 === "binding")) || (key0 === "page_index")) || (key0 === "next_page_index")) || (key0 === "records"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.format_version !== undefined && func0.call(data, "format_version")){
if("snapshot-projection/0.2.0-draft.1" !== data.format_version){
const err6 = {instancePath:instancePath+"/format_version",schemaPath:"#/properties/format_version/const",keyword:"const",params:{allowedValue: "snapshot-projection/0.2.0-draft.1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.binding !== undefined && func0.call(data, "binding")){
if(!(validate434.call(this, data.binding, {instancePath:instancePath+"/binding",parentData:data,parentDataProperty:"binding",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate434.errors : vErrors.concat(validate434.errors);
errors = vErrors.length;
}
}
if(data.page_index !== undefined && func0.call(data, "page_index")){
let data2 = data.page_index;
if(!((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2)))){
const err7 = {instancePath:instancePath+"/page_index",schemaPath:"#/properties/page_index/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(typeof data2 == "number"){
if(data2 > 127 || isNaN(data2)){
const err8 = {instancePath:instancePath+"/page_index",schemaPath:"#/properties/page_index/maximum",keyword:"maximum",params:{comparison: "<=", limit: 127},message:"must be <= 127"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err9 = {instancePath:instancePath+"/page_index",schemaPath:"#/properties/page_index/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
const rawToken0 = this && this.numbers && this.numbers.get(instancePath + "/page_index");
if(!rawToken0 || !rawToken0.integer || !rawToken0.safe){
const err10 = {instancePath:instancePath+"/page_index",schemaPath:"#/properties/page_index/xRawInteger",keyword:"xRawInteger",params:{},message:"must pass \"xRawInteger\" keyword validation"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
if(data.next_page_index !== undefined && func0.call(data, "next_page_index")){
let data3 = data.next_page_index;
const _errs7 = errors;
let valid1 = false;
const _errs8 = errors;
if(!((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3)))){
const err11 = {instancePath:instancePath+"/next_page_index",schemaPath:"#/properties/next_page_index/anyOf/0/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(typeof data3 == "number"){
if(data3 > 127 || isNaN(data3)){
const err12 = {instancePath:instancePath+"/next_page_index",schemaPath:"#/properties/next_page_index/anyOf/0/maximum",keyword:"maximum",params:{comparison: "<=", limit: 127},message:"must be <= 127"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data3 < 0 || isNaN(data3)){
const err13 = {instancePath:instancePath+"/next_page_index",schemaPath:"#/properties/next_page_index/anyOf/0/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
const rawToken1 = this && this.numbers && this.numbers.get(instancePath + "/next_page_index");
if(!rawToken1 || !rawToken1.integer || !rawToken1.safe){
const err14 = {instancePath:instancePath+"/next_page_index",schemaPath:"#/properties/next_page_index/anyOf/0/xRawInteger",keyword:"xRawInteger",params:{},message:"must pass \"xRawInteger\" keyword validation"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
var _valid0 = _errs8 === errors;
valid1 = valid1 || _valid0;
const _errs10 = errors;
if(data3 !== null){
const err15 = {instancePath:instancePath+"/next_page_index",schemaPath:"#/properties/next_page_index/anyOf/1/type",keyword:"type",params:{type: "null"},message:"must be null"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
var _valid0 = _errs10 === errors;
valid1 = valid1 || _valid0;
if(!valid1){
const err16 = {instancePath:instancePath+"/next_page_index",schemaPath:"#/properties/next_page_index/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
else {
errors = _errs7;
if(vErrors !== null){
if(_errs7){
vErrors.length = _errs7;
}
else {
vErrors = null;
}
}
}
}
if(data.records !== undefined && func0.call(data, "records")){
let data4 = data.records;
if(Array.isArray(data4)){
if(data4.length > 256){
const err17 = {instancePath:instancePath+"/records",schemaPath:"#/properties/records/maxItems",keyword:"maxItems",params:{limit: 256},message:"must NOT have more than 256 items"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
const len0 = data4.length;
for(let i0=0; i0<len0; i0++){
if(!(validate164.call(this, data4[i0], {instancePath:instancePath+"/records/" + i0,parentData:data4,parentDataProperty:i0,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate164.errors : vErrors.concat(validate164.errors);
errors = vErrors.length;
}
}
}
else {
const err18 = {instancePath:instancePath+"/records",schemaPath:"#/properties/records/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
}
else {
const err19 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
validate470.errors = vErrors;
return errors === 0;
}
validate470.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate467(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate467.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if((data.manifest_digest === undefined) || (!(func0.call(data, "manifest_digest")))){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "manifest_digest"},message:"must have required property '"+"manifest_digest"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if((data.content_digest === undefined) || (!(func0.call(data, "content_digest")))){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "content_digest"},message:"must have required property '"+"content_digest"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if((data.content === undefined) || (!(func0.call(data, "content")))){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "content"},message:"must have required property '"+"content"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if((data.delivery_binding === undefined) || (!(func0.call(data, "delivery_binding")))){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "delivery_binding"},message:"must have required property '"+"delivery_binding"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 of Object.keys(data)){
if(!((((key0 === "manifest_digest") || (key0 === "content_digest")) || (key0 === "content")) || (key0 === "delivery_binding"))){
const err4 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.manifest_digest !== undefined && func0.call(data, "manifest_digest")){
if(!(validate99.call(this, data.manifest_digest, {instancePath:instancePath+"/manifest_digest",parentData:data,parentDataProperty:"manifest_digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate99.errors : vErrors.concat(validate99.errors);
errors = vErrors.length;
}
}
if(data.content_digest !== undefined && func0.call(data, "content_digest")){
if(!(validate99.call(this, data.content_digest, {instancePath:instancePath+"/content_digest",parentData:data,parentDataProperty:"content_digest",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate99.errors : vErrors.concat(validate99.errors);
errors = vErrors.length;
}
}
if(data.content !== undefined && func0.call(data, "content")){
if(!(validate470.call(this, data.content, {instancePath:instancePath+"/content",parentData:data,parentDataProperty:"content",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate470.errors : vErrors.concat(validate470.errors);
errors = vErrors.length;
}
}
if(data.delivery_binding !== undefined && func0.call(data, "delivery_binding")){
if(!(validate151.call(this, data.delivery_binding, {instancePath:instancePath+"/delivery_binding",parentData:data,parentDataProperty:"delivery_binding",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate151.errors : vErrors.concat(validate151.errors);
errors = vErrors.length;
}
}
}
else {
const err5 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
validate467.errors = vErrors;
return errors === 0;
}
validate467.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
