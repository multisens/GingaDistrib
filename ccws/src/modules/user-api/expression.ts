exports.getUsersExpression = (body, service) => {
	let exp = `users['${service}' in accessConsent`;
	if (body.and || body.or || body.attribute) {
		// parse the body to construct query
		exp += ` and ${parseExpression(body)}`;
	}
	exp += "]{ 'users': [$.{ 'id': id }] }";
	return exp;
}


function parseExpression(exp) {
	if (exp.attribute) {
		return exp.attribute + parseComparator(exp.comparator) + parseValue(exp.attribute, exp.value);
	}
	else if (exp.and) {
		return parseArray(exp.and, 'and');
	}
	else if (exp.or) {
		return parseArray(exp.or, 'or');
	}
}


function parseValue(att, val) {
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


function parseArray(arr, op) {
	let exp = '(' + parseExpression(arr[0]);
	for (var i = 1; i < arr.length; i++) {
		exp += ` ${op} ` + parseExpression(arr[i]);
	}
	exp += ')';
	return exp;
}


function parseComparator(cmp) {
	if (cmp == 'eq') { return '='; }
	else if (cmp == 'neq') { return '!='; }
	else if (cmp == 'lt') { return '<'; }
	else if (cmp == 'lte') { return '<='; }
	else if (cmp == 'gt') { return '>'; }
	else if (cmp == 'gte') { return '>='; }
}


exports.getAttExpression = (service, user_id, attname) => {
    let exp = `users['${service}' in accessConsent and id='${user_id}']`;
    if (attname != null)
        exp += `.${attname}`;
    return exp;
}


exports.getConsentExpression = (service, path) => {
    let exp = `users['${service}' in accessConsent and avatar='${path}'] != null`;
	return exp;
}