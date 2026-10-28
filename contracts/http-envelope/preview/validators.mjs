import {requireStatic as require} from "../../wire-routing/preview/helpers.mjs";
"use strict";
export const p0 = validate20;
const schema31 = {"type":"string","minLength":1,"maxLength":128,"pattern":"^[A-Za-z0-9._-]+$"};
const func60 = require("ajv/dist/runtime/ucs2length").default;
const pattern4 = new RegExp("^[A-Za-z0-9._-]+$", "u");

function validate20(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate20.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func60(data) > 128){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(func60(data) < 1){
const err1 = {instancePath,schemaPath:"#/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(!pattern4.test(data)){
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
validate20.errors = vErrors;
return errors === 0;
}
validate20.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p1 = validate21;
const schema32 = {"const":"leafseamer.api.v1.events2"};

function validate21(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate21.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if("leafseamer.api.v1.events2" !== data){
const err0 = {instancePath,schemaPath:"#/const",keyword:"const",params:{allowedValue: "leafseamer.api.v1.events2"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
validate21.errors = vErrors;
return errors === 0;
}
validate21.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p2 = validate22;
const schema33 = {"type":"string","pattern":"^sha256:[0-9a-f]{64}$","minLength":71,"maxLength":71};
const pattern5 = new RegExp("^sha256:[0-9a-f]{64}$", "u");

function validate22(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate22.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func60(data) > 71){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 71},message:"must NOT have more than 71 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(func60(data) < 71){
const err1 = {instancePath,schemaPath:"#/minLength",keyword:"minLength",params:{limit: 71},message:"must NOT have fewer than 71 characters"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(!pattern5.test(data)){
const err2 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^sha256:[0-9a-f]{64}$"},message:"must match pattern \""+"^sha256:[0-9a-f]{64}$"+"\""};
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
validate22.errors = vErrors;
return errors === 0;
}
validate22.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p3 = validate23;
const schema34 = {"type":"string","const":"no-store"};

function validate23(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate23.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data !== "string"){
const err0 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if("no-store" !== data){
const err1 = {instancePath,schemaPath:"#/const",keyword:"const",params:{allowedValue: "no-store"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate23.errors = vErrors;
return errors === 0;
}
validate23.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p4 = validate24;
const schema35 = {"type":"string","minLength":1,"maxLength":256,"pattern":"^[A-Za-z0-9._:/-]+$(?![\\s\\S])"};
const pattern6 = new RegExp("^[A-Za-z0-9._:/-]+$(?![\\s\\S])", "u");

function validate24(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate24.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func60(data) > 256){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(func60(data) < 1){
const err1 = {instancePath,schemaPath:"#/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(!pattern6.test(data)){
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
validate24.errors = vErrors;
return errors === 0;
}
validate24.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p5 = validate25;
const schema36 = {"const":"no-store"};

function validate25(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate25.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if("no-store" !== data){
const err0 = {instancePath,schemaPath:"#/const",keyword:"const",params:{allowedValue: "no-store"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
validate25.errors = vErrors;
return errors === 0;
}
validate25.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p6 = validate26;
const schema37 = {"type":"string","pattern":"^[1-9][0-9]{0,19}$(?![\\s\\S])"};
const pattern7 = new RegExp("^[1-9][0-9]{0,19}$(?![\\s\\S])", "u");

function validate26(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate26.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(!pattern7.test(data)){
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
validate26.errors = vErrors;
return errors === 0;
}
validate26.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p7 = validate27;
const schema38 = {"type":"string","minLength":16,"maxLength":4096,"pattern":"^[A-Za-z0-9_-]+$(?![\\s\\S])"};
const pattern8 = new RegExp("^[A-Za-z0-9_-]+$(?![\\s\\S])", "u");

function validate27(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate27.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func60(data) > 4096){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 4096},message:"must NOT have more than 4096 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(func60(data) < 16){
const err1 = {instancePath,schemaPath:"#/minLength",keyword:"minLength",params:{limit: 16},message:"must NOT have fewer than 16 characters"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(!pattern8.test(data)){
const err2 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_-]+$(?![\\s\\S])"},message:"must match pattern \""+"^[A-Za-z0-9_-]+$(?![\\s\\S])"+"\""};
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
validate27.errors = vErrors;
return errors === 0;
}
validate27.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p8 = validate28;
const schema39 = {"type":"integer","minimum":1,"maximum":64};

function validate28(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate28.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!((typeof data == "number") && (!(data % 1) && !isNaN(data)))){
const err0 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(typeof data == "number"){
if(data > 64 || isNaN(data)){
const err1 = {instancePath,schemaPath:"#/maximum",keyword:"maximum",params:{comparison: "<=", limit: 64},message:"must be <= 64"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data < 1 || isNaN(data)){
const err2 = {instancePath,schemaPath:"#/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
validate28.errors = vErrors;
return errors === 0;
}
validate28.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p9 = validate29;
const schema40 = {"type":"string","minLength":1,"maxLength":128,"pattern":"^[A-Za-z0-9_.:-]+$(?![\\s\\S])"};
const pattern9 = new RegExp("^[A-Za-z0-9_.:-]+$(?![\\s\\S])", "u");

function validate29(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate29.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func60(data) > 128){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(func60(data) < 1){
const err1 = {instancePath,schemaPath:"#/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(!pattern9.test(data)){
const err2 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9_.:-]+$(?![\\s\\S])"},message:"must match pattern \""+"^[A-Za-z0-9_.:-]+$(?![\\s\\S])"+"\""};
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
validate29.errors = vErrors;
return errors === 0;
}
validate29.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p10 = validate30;
const schema41 = {"type":"string","pattern":"^https://","format":"uri"};
const formats0 = require("ajv-formats/dist/formats").fullFormats.uri;
const pattern10 = new RegExp("^https://", "u");

function validate30(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate30.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(!pattern10.test(data)){
const err0 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^https://"},message:"must match pattern \""+"^https://"+"\""};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(!(formats0(data))){
const err1 = {instancePath,schemaPath:"#/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""};
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
validate30.errors = vErrors;
return errors === 0;
}
validate30.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p11 = validate31;
const schema42 = {"type":"string","pattern":"^leafseamer\\.contract\\.leafseamer\\.api\\.v1\\.events2\\.[0-9a-f]{64}(?![\\s\\S])"};
const pattern11 = new RegExp("^leafseamer\\.contract\\.leafseamer\\.api\\.v1\\.events2\\.[0-9a-f]{64}(?![\\s\\S])", "u");

function validate31(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate31.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(!pattern11.test(data)){
const err0 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^leafseamer\\.contract\\.leafseamer\\.api\\.v1\\.events2\\.[0-9a-f]{64}(?![\\s\\S])"},message:"must match pattern \""+"^leafseamer\\.contract\\.leafseamer\\.api\\.v1\\.events2\\.[0-9a-f]{64}(?![\\s\\S])"+"\""};
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
validate31.errors = vErrors;
return errors === 0;
}
validate31.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p12 = validate32;
const schema43 = {"type":"string","pattern":"^sha256:[0-9a-f]{64}(?![\\s\\S])"};
const pattern12 = new RegExp("^sha256:[0-9a-f]{64}(?![\\s\\S])", "u");

function validate32(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate32.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(!pattern12.test(data)){
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
validate32.errors = vErrors;
return errors === 0;
}
validate32.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p13 = validate33;
const schema44 = {"type":"string","minLength":1,"maxLength":512};

function validate33(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate33.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func60(data) > 512){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 512},message:"must NOT have more than 512 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(func60(data) < 1){
const err1 = {instancePath,schemaPath:"#/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
validate33.errors = vErrors;
return errors === 0;
}
validate33.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p14 = validate34;
const schema45 = {"type":"string","minLength":1,"maxLength":128,"pattern":"^[A-Za-z0-9][A-Za-z0-9_.:-]*(?![\\s\\S])"};
const pattern13 = new RegExp("^[A-Za-z0-9][A-Za-z0-9_.:-]*(?![\\s\\S])", "u");

function validate34(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate34.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func60(data) > 128){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(func60(data) < 1){
const err1 = {instancePath,schemaPath:"#/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(!pattern13.test(data)){
const err2 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9][A-Za-z0-9_.:-]*(?![\\s\\S])"},message:"must match pattern \""+"^[A-Za-z0-9][A-Za-z0-9_.:-]*(?![\\s\\S])"+"\""};
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
validate34.errors = vErrors;
return errors === 0;
}
validate34.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p15 = validate35;
const schema46 = {"type":"string","minLength":1,"maxLength":256};

function validate35(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate35.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func60(data) > 256){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 256},message:"must NOT have more than 256 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(func60(data) < 1){
const err1 = {instancePath,schemaPath:"#/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
validate35.errors = vErrors;
return errors === 0;
}
validate35.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p16 = validate36;
const schema47 = {"type":"string","pattern":"^[A-Za-z0-9._-]{1,128}(?![\\s\\S])"};
const pattern14 = new RegExp("^[A-Za-z0-9._-]{1,128}(?![\\s\\S])", "u");

function validate36(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate36.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(!pattern14.test(data)){
const err0 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^[A-Za-z0-9._-]{1,128}(?![\\s\\S])"},message:"must match pattern \""+"^[A-Za-z0-9._-]{1,128}(?![\\s\\S])"+"\""};
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
validate36.errors = vErrors;
return errors === 0;
}
validate36.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p17 = validate37;
const schema48 = {"const":"no-store","type":"string"};

function validate37(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate37.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data !== "string"){
const err0 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if("no-store" !== data){
const err1 = {instancePath,schemaPath:"#/const",keyword:"const",params:{allowedValue: "no-store"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate37.errors = vErrors;
return errors === 0;
}
validate37.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p18 = validate38;
const schema49 = {"type":"string","pattern":"^(0|[1-9][0-9]*)(?![\\s\\S])","maxLength":20};
const pattern15 = new RegExp("^(0|[1-9][0-9]*)(?![\\s\\S])", "u");

function validate38(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate38.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func60(data) > 20){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 20},message:"must NOT have more than 20 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(!pattern15.test(data)){
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
validate38.errors = vErrors;
return errors === 0;
}
validate38.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p19 = validate39;
const schema50 = {"type":"integer","minimum":1,"maximum":8};

function validate39(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate39.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!((typeof data == "number") && (!(data % 1) && !isNaN(data)))){
const err0 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(typeof data == "number"){
if(data > 8 || isNaN(data)){
const err1 = {instancePath,schemaPath:"#/maximum",keyword:"maximum",params:{comparison: "<=", limit: 8},message:"must be <= 8"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data < 1 || isNaN(data)){
const err2 = {instancePath,schemaPath:"#/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
validate39.errors = vErrors;
return errors === 0;
}
validate39.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p20 = validate40;
const schema51 = {"type":"string","pattern":"^[A-Za-z0-9_-]{1,128}(?![\\s\\S])","maxLength":128};
const pattern16 = new RegExp("^[A-Za-z0-9_-]{1,128}(?![\\s\\S])", "u");

function validate40(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate40.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(func60(data) > 128){
const err0 = {instancePath,schemaPath:"#/maxLength",keyword:"maxLength",params:{limit: 128},message:"must NOT have more than 128 characters"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(!pattern16.test(data)){
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
validate40.errors = vErrors;
return errors === 0;
}
validate40.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p21 = validate41;
const schema52 = {"type":"string","pattern":"^sha256:[0-9a-f]{64}$(?![\\s\\S])"};
const pattern17 = new RegExp("^sha256:[0-9a-f]{64}$(?![\\s\\S])", "u");

function validate41(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate41.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(!pattern17.test(data)){
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
validate41.errors = vErrors;
return errors === 0;
}
validate41.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p22 = validate42;
const schema53 = {"type":"string","format":"uri"};

function validate42(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate42.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(!(formats0(data))){
const err0 = {instancePath,schemaPath:"#/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""};
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
validate42.errors = vErrors;
return errors === 0;
}
validate42.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p23 = validate43;
const schema54 = {"type":"string"};

function validate43(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate43.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data !== "string"){
const err0 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
validate43.errors = vErrors;
return errors === 0;
}
validate43.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p24 = validate44;
const schema55 = {"type":"integer","minimum":0,"maximum":127};

function validate44(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate44.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(!((typeof data == "number") && (!(data % 1) && !isNaN(data)))){
const err0 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(typeof data == "number"){
if(data > 127 || isNaN(data)){
const err1 = {instancePath,schemaPath:"#/maximum",keyword:"maximum",params:{comparison: "<=", limit: 127},message:"must be <= 127"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data < 0 || isNaN(data)){
const err2 = {instancePath,schemaPath:"#/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
validate44.errors = vErrors;
return errors === 0;
}
validate44.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p25 = validate45;
const schema56 = {"type":"string","pattern":"^(0|[1-9][0-9]{0,19})$(?![\\s\\S])"};
const pattern18 = new RegExp("^(0|[1-9][0-9]{0,19})$(?![\\s\\S])", "u");

function validate45(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate45.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(!pattern18.test(data)){
const err0 = {instancePath,schemaPath:"#/pattern",keyword:"pattern",params:{pattern: "^(0|[1-9][0-9]{0,19})$(?![\\s\\S])"},message:"must match pattern \""+"^(0|[1-9][0-9]{0,19})$(?![\\s\\S])"+"\""};
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
validate45.errors = vErrors;
return errors === 0;
}
validate45.evaluated = {"dynamicProps":false,"dynamicItems":false};

export const p26 = validate46;
const schema57 = {"type":"string","pattern":"^[A-Za-z0-9_-]{1,128}(?![\\s\\S])"};

function validate46(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate46.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(typeof data === "string"){
if(!pattern16.test(data)){
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
validate46.errors = vErrors;
return errors === 0;
}
validate46.evaluated = {"dynamicProps":false,"dynamicItems":false};
