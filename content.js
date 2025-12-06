const MEMBER_BADGE_SELECTOR = 'div:has(> div[role="tooltip"] > div[tabindex="-1"] > div > p)';
const READ_LOCAL_ATTR = 'data-read-local-button';
const READ_LOCAL_TEXT = 'Read Local';
const LOCAL_PREFIX = 'http://localhost:6752/';

let pendingInjectionHandle = null;
let domObserver = null;
let navigationListenersAttached = false;

const isMediumContext = () => {
	const host = window.location.hostname.toLowerCase();

	if (host.endsWith('.ru')) {
		return false;
	}

	if (host === 'medium.com' || host.endsWith('.medium.com')) {
		return true;
	}

	const head = document.head;

	if (!head) {
		return false;
	}

	return Boolean(
		head.querySelector(
			'link[data-rh="true"][rel="search"][type="application/opensearchdescription+xml"][title="Medium"]'
		)
	);
};

const scheduleInjection = () => {
	if (pendingInjectionHandle !== null) {
		return;
	}

	const raf = window.requestAnimationFrame?.bind(window);

	const callback = () => {
		pendingInjectionHandle = null;
		injectReadLocalButtons();
	};

	if (raf) {
		pendingInjectionHandle = raf(callback);
		return;
	}

	pendingInjectionHandle = window.setTimeout(callback, 16);
};

const startDomObserver = () => {
	if (domObserver) {
		return;
	}

	domObserver = new MutationObserver(() => {
		scheduleInjection();
	});

	const targetNode = document.documentElement || document.body;

	if (targetNode) {
		domObserver.observe(targetNode, {
			childList: true,
			subtree: true
		});
	}
};

const setupNavigationListeners = () => {
	if (navigationListenersAttached) {
		return;
	}

	navigationListenersAttached = true;

	const triggerInjection = () => {
		scheduleInjection();
	};

	const wrapHistoryMethod = (methodName) => {
		const original = history[methodName];

		if (typeof original !== 'function') {
			return;
		}

		history[methodName] = function wrapper(...args) {
			const result = original.apply(this, args);
			triggerInjection();
			return result;
		};
	};

	wrapHistoryMethod('pushState');
	wrapHistoryMethod('replaceState');

	window.addEventListener('popstate', triggerInjection);
	window.addEventListener('hashchange', triggerInjection);
};

const buildLocalUrl = () => `${LOCAL_PREFIX}${window.location.href}`;

const applyReadLocalStyles = (element) => {
	if (!element || element.nodeType !== Node.ELEMENT_NODE) {
		return;
	}

	element.style.setProperty('background', '#aafea9ff', 'important');
	// element.style.setProperty('color', '#0a2b00', 'important');
	// element.style.setProperty('border', '1px solid #0f9b0f', 'important');
	// element.style.setProperty('borderRadius', '999px', 'important');
	// element.style.setProperty('cursor', 'pointer');
};

const buildReadLocalButton = (original) => {
	const clone = original.cloneNode(true);

	if (!clone || clone.nodeType !== Node.ELEMENT_NODE) {
		return null;
	}

	clone.setAttribute(READ_LOCAL_ATTR, 'true');

	if (clone.hasAttribute('id')) {
		clone.removeAttribute('id');
	}

	clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));

	const textNode = clone.querySelector('div[role="tooltip"] > div[tabindex="-1"] > div > p');
	if (textNode) {
		textNode.textContent = READ_LOCAL_TEXT;
	} else {
		clone.textContent = READ_LOCAL_TEXT;
	}

	const localUrl = buildLocalUrl();
	const interactive =
		clone.matches('a, button') ?
			clone :
			clone.querySelector('a, button');

	const openLocal = (event) => {
		event.preventDefault();
		event.stopPropagation();
		window.open(localUrl, '_blank', 'noopener,noreferrer');
	};

	if (interactive) {
		if (interactive.hasAttribute('id')) {
			interactive.removeAttribute('id');
		}

		if (interactive.tagName.toLowerCase() === 'a') {
			interactive.setAttribute('href', localUrl);
			interactive.setAttribute('target', '_blank');
			interactive.setAttribute('rel', 'noopener noreferrer');
		} else {
			interactive.addEventListener('click', openLocal);
		}

		// applyReadLocalStyles(interactive);
	} else {
		clone.addEventListener('click', openLocal);
	}

	// applyReadLocalStyles(clone);

	applyReadLocalStyles(clone.children[0].children[0].children[0]);

	return clone;
};

const injectReadLocalButtons = () => {
	if (!isMediumContext()) {
		return false;
	}

	const targets = document.querySelectorAll(MEMBER_BADGE_SELECTOR);

	if (!targets.length) {
		return false;
	}

	let injected = false;

	targets.forEach((target) => {
		if (!target || target.nodeType !== Node.ELEMENT_NODE) {
			return;
		}

		const parent = target.parentElement;

		if (!parent) {
			return;
		}

		if (parent.querySelector(`[${READ_LOCAL_ATTR}="true"]`)) {
			return;
		}

		const readLocalButton = buildReadLocalButton(target);

		if (!readLocalButton) {
			return;
		}

		parent.insertBefore(readLocalButton, target.nextSibling);
		injected = true;
	});

	return injected;
};

const init = () => {
	setupNavigationListeners();
	startDomObserver();

	if (!injectReadLocalButtons()) {
		scheduleInjection();
	}
};

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
	init();
}
