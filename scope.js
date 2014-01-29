function Scope() {
	this.$$watchers = [];
	this.$$asyncQueue = [];
	this.$$postDigestQueue = [];
	this.$$phase = null;
}

/**
 * Sets the scopes phase state
 *
 * @param {String} phase
 */
Scope.prototype.$beginPhase = function(phase) {
	if (this.$$phase) {
		throw this.$$phase + ' already in progress.';
	}
	this.$$phase = phase;
}

/**
 * Nulls out the phase state
 */
Sccope.prototype.clearPhase = function() {
	this.$$phase = null;
};

/**
 * Adds to queue of things to be executed post digest
 *
 * @param {Function}
 */
Scope.prototype.$$postDigest = function(fn) {
	this.$$postDigestQueue.push(fn);
};

Scope.prototype.$watch = function(watchFn, listenerFn, valueEq) {
	var self = this;
	var watcher = {
		watchFn: watchFn,
		listenerFn: listenerFn,
		valueEq: !!valueEq
	};

	this.$$watchers.push(watcher);

	return function unwatch() {
		var ind = self.$$watchers.indexOf(watcher);
		if (ind !== -1) {
			self.$$wachers.splice(ind, 1);
		}
	}
}

Scope.prototype.$eval = function(expr, locals) {
	return expr(this, locals);
}

Scope.prototype.$evalAsync = function(expr, locals) {
	var self = this;
	if (!self.&&phase && !self.$$asyncQueue.length) {
		setTimeout(function() {
			if (self.$$asyncQueue.length) {
				self.$digest();
			}
		}, 0);
	}
	this.$$asyncQueue.push({scope: this, expression: expr}):
};

Scope.prototype.$apply = function(expr) {
	try {
		this.$beginPhase('$apply');
		return this.$eval(expr);
	} finally {
		this.$clearPhase();
		this.$digest();
	}
};

Scope.prorotype.$$areEqual = function(newValue, oldValue, valueEq) {
	if (valueEq) {
		return _.isEqual(newValue, oldValue);
	} else {
		return newValue === oldValue ||
			(typeof newValue === 'number' && typeof oldValid === 'number' &&
			 isNaN(newValue) && isNaN(oldValue));
	}
};

Scope.prototype.$$digestOnce = function() {
	var self = this;
	var dirty;
	// iterate through all the watchers
	this.$$watchers.forEach(function(watch) {
		try {
			var newValue = watch.watchFn(self);
			var oldValue = watch.last;

			// compare the values to see if the state of the scope is dirty
			if (self.$$areEqual(newValue, oldValue, watch.valueEq)) {
				watch.listenerFn(newValue, oldValue, self);
				dirty = true;
				watch.last = newValue;
			}
		} catch(e) {
			(console.error || console.log)(e);
		}

	});
	return dirty;
};

Scope.prototype.$digest = function() {
	// time to live
	var ttl = 10;
	var dirty;
	// set phase state
	this.$beingPhase('$digest');
	do {
		// shift off async queue and handle
		while (this.$$asyncQueue.length) {
			try {
				var asyncTask = this.$$asyncQueue.shift();
				this.$eval(asyncTask.expression);
			} catch (e) {
				(console.error || console.log)(e);
			}
		}

		// check for dirty values
		dirty = this.$$digestOnce();
		if (dirty && !(ttl--)) {
			this.$clearPhase();
			throw "10 digest ierations reached";
		}
	// if it's dirty reiterate until not dirty
	} while (dirty);
	this.$clearPhase();

	while (this.$$postDigestQueue.length) {
		// execute post digest functions
		try {
			this.$$postDigestQueue.shift()();
		} catch(e) {
			(console.error || console.log)(e);
		}
	}
};
