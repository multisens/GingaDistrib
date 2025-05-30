import { Expression } from './types';


function getUsersExpression(body: Expression, service: string): string {
	let exp = `users['${service}' in accessConsent and ${parseExpression(body)}]{ 'users': [$.{ 'id': id }] }`;
	return exp;
}

function parseExpression(exp: Expression): string {
	if ('attribute' in exp) {
		return exp.attribute + exp.comparator + parseValue(exp.attribute, exp.value);
	}
	else if ('and' in exp) {
		return parseArray(exp.and, 'and');
	}
	else {
		return parseArray(exp.or, 'or');
	}
}

function parseValue(att: string, val: string): string {
	if (att == 'age') {
		return val;
	}
	else if (val == 'true' || val == 'false') {
		return val;
	}
	else {
		return `'${val}'`
	}
}

function parseArray(arr: Expression[], op: string): string {
	let exp = '(' + parseExpression(arr[0]);
	for (var i = 1; i < arr.length; i++) {
		exp += ` ${op} ` + parseExpression(arr[i]);
	}
	exp += ')';
	return exp;
}

function getAttExpression(service: string, user_id: string, attname?: string): string {
	let exp = `users['${service}' in accessConsent and id='${user_id}']`;
	if (attname)
		exp += `.${attname}`;
    return exp;
}

function getConsentExpression(service: string, path: string): string {
    let exp = `users['${service}' in accessConsent and avatar='${path}'] != null`;
	return exp;
}


export default { getUsersExpression, getAttExpression, getConsentExpression }