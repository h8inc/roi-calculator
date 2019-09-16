
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_binding_callback(fn) {
        binding_callbacks.push(fn);
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_render.forEach(add_render_callback);
    }
    function destroy(component, detaching) {
        if (component.$$) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro && component.$$.fragment.i)
                component.$$.fragment.i();
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy(this, true);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/RoiCalculator.html generated by Svelte v3.5.1 */

    const file = "src/RoiCalculator.html";

    // (124:4) {:else}
    function create_else_block(ctx) {
    	var div5, h1, t1, label0, t3, div0, t4_value = ctx.wastedHoursProject.toLocaleString('en', ctx.decimalOptions), t4, t5, label1, t7, div1, t8_value = ctx.opportunityCost.toLocaleString('en', ctx.currencyOptions), t8, t9, label2, t11, div2, t12_value = ctx.billableHoursYearly.toLocaleString('en', ctx.integerOptions), t12, t13, label3, t15, div3, t16_value = ctx.revenueIncrease.toLocaleString('en', ctx.currencyOptions), t16, t17, div4, p0, t19, p1, span, t21, a, t22, dispose;

    	return {
    		c: function create() {
    			div5 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Results with a DAM";
    			t1 = space();
    			label0 = element("label");
    			label0.textContent = "Billable hours per project saved:";
    			t3 = space();
    			div0 = element("div");
    			t4 = text(t4_value);
    			t5 = space();
    			label1 = element("label");
    			label1.textContent = "Opportunity cost per project:";
    			t7 = space();
    			div1 = element("div");
    			t8 = text(t8_value);
    			t9 = space();
    			label2 = element("label");
    			label2.textContent = "Freed up billable hours yearly:";
    			t11 = space();
    			div2 = element("div");
    			t12 = text(t12_value);
    			t13 = space();
    			label3 = element("label");
    			label3.textContent = "Potential revenue increase per year with a DAM";
    			t15 = space();
    			div3 = element("div");
    			t16 = text(t16_value);
    			t17 = space();
    			div4 = element("div");
    			p0 = element("p");
    			p0.textContent = "To share these results with your colleagues:";
    			t19 = space();
    			p1 = element("p");
    			span = element("span");
    			span.textContent = "✅";
    			t21 = space();
    			a = element("a");
    			t22 = text("copy this link");
    			h1.className = "svelte-1nz7tj7";
    			add_location(h1, file, 125, 8, 6039);
    			label0.className = "svelte-1nz7tj7";
    			add_location(label0, file, 126, 8, 6075);
    			div0.className = "result svelte-1nz7tj7";
    			add_location(div0, file, 127, 8, 6132);
    			label1.className = "svelte-1nz7tj7";
    			add_location(label1, file, 128, 8, 6224);
    			div1.className = "result svelte-1nz7tj7";
    			add_location(div1, file, 129, 8, 6277);
    			label2.className = "svelte-1nz7tj7";
    			add_location(label2, file, 130, 8, 6367);
    			div2.className = "result svelte-1nz7tj7";
    			add_location(div2, file, 131, 8, 6422);
    			label3.className = "svelte-1nz7tj7";
    			add_location(label3, file, 132, 8, 6515);
    			div3.className = "result svelte-1nz7tj7";
    			add_location(div3, file, 133, 8, 6585);
    			add_location(p0, file, 135, 12, 6711);
    			span.className = "roi-copy-feedback svelte-1nz7tj7";
    			toggle_class(span, "roi-copy-feedback-visible", ctx.linkCopyFeedback);
    			add_location(span, file, 136, 15, 6778);
    			a.className = "roi-link svelte-1nz7tj7";
    			a.href = ctx.shareableLink;
    			add_location(a, file, 136, 107, 6870);
    			add_location(p1, file, 136, 12, 6775);
    			div4.className = "roi-share svelte-1nz7tj7";
    			add_location(div4, file, 134, 8, 6675);
    			div5.className = "roi-block sticky svelte-1nz7tj7";
    			add_location(div5, file, 124, 4, 6000);
    			dispose = listen(a, "click", ctx.copyLink);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div5, anchor);
    			append(div5, h1);
    			append(div5, t1);
    			append(div5, label0);
    			append(div5, t3);
    			append(div5, div0);
    			append(div0, t4);
    			append(div5, t5);
    			append(div5, label1);
    			append(div5, t7);
    			append(div5, div1);
    			append(div1, t8);
    			append(div5, t9);
    			append(div5, label2);
    			append(div5, t11);
    			append(div5, div2);
    			append(div2, t12);
    			append(div5, t13);
    			append(div5, label3);
    			append(div5, t15);
    			append(div5, div3);
    			append(div3, t16);
    			append(div5, t17);
    			append(div5, div4);
    			append(div4, p0);
    			append(div4, t19);
    			append(div4, p1);
    			append(p1, span);
    			append(p1, t21);
    			append(p1, a);
    			append(a, t22);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.wastedHoursProject) && t4_value !== (t4_value = ctx.wastedHoursProject.toLocaleString('en', ctx.decimalOptions))) {
    				set_data(t4, t4_value);
    			}

    			if ((changed.opportunityCost) && t8_value !== (t8_value = ctx.opportunityCost.toLocaleString('en', ctx.currencyOptions))) {
    				set_data(t8, t8_value);
    			}

    			if ((changed.billableHoursYearly) && t12_value !== (t12_value = ctx.billableHoursYearly.toLocaleString('en', ctx.integerOptions))) {
    				set_data(t12, t12_value);
    			}

    			if ((changed.revenueIncrease) && t16_value !== (t16_value = ctx.revenueIncrease.toLocaleString('en', ctx.currencyOptions))) {
    				set_data(t16, t16_value);
    			}

    			if (changed.linkCopyFeedback) {
    				toggle_class(span, "roi-copy-feedback-visible", ctx.linkCopyFeedback);
    			}

    			if (changed.shareableLink) {
    				a.href = ctx.shareableLink;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div5);
    			}

    			dispose();
    		}
    	};
    }

    // (116:4) {#if showExplanation}
    function create_if_block(ctx) {
    	var div1, h1, t1, div0, t3, button, dispose;

    	return {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "How does it work";
    			t1 = space();
    			div0 = element("div");
    			div0.textContent = "Fill in the fields about your team and processes. We've entered default values to help you get started.";
    			t3 = space();
    			button = element("button");
    			button.textContent = "Calculate";
    			h1.className = "svelte-1nz7tj7";
    			add_location(h1, file, 117, 8, 5754);
    			div0.className = "svelte-1nz7tj7";
    			add_location(div0, file, 118, 8, 5788);
    			button.className = "svelte-1nz7tj7";
    			add_location(button, file, 121, 8, 5929);
    			div1.className = "roi-block sticky roi-how svelte-1nz7tj7";
    			add_location(div1, file, 116, 4, 5707);
    			dispose = listen(button, "click", ctx.start);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, h1);
    			append(div1, t1);
    			append(div1, div0);
    			append(div1, t3);
    			append(div1, button);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div1);
    			}

    			dispose();
    		}
    	};
    }

    function create_fragment(ctx) {
    	var div4, div3, h1, t1, label0, t3, input0, input0_placeholder_value, t4, label1, t6, div1, input1, input1_placeholder_value, t7, div0, t8, t9, label2, t11, input2, input2_placeholder_value, t12, label3, t14, input3, input3_placeholder_value, t15, label4, t17, input4, input4_placeholder_value, t18, label5, t20, input5, input5_placeholder_value, t21, label6, t23, input6, input6_placeholder_value, t24, label7, t26, input7, input7_placeholder_value, t27, label8, t29, input8, input8_placeholder_value, t30, label9, t32, div2, label10, input9, t33, t34, t35, t36, label11, input10, t37, t38, t39, t40, dispose;

    	function select_block_type(ctx) {
    		if (ctx.showExplanation) return create_if_block;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Estimate Savings";
    			t1 = space();
    			label0 = element("label");
    			label0.textContent = "Team members per client project";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			label1 = element("label");
    			label1.textContent = "Billable hourly rate per team member";
    			t6 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t7 = space();
    			div0 = element("div");
    			t8 = text(currency);
    			t9 = space();
    			label2 = element("label");
    			label2.textContent = "Client projects per year";
    			t11 = space();
    			input2 = element("input");
    			t12 = space();
    			label3 = element("label");
    			label3.textContent = "Time spent collecting client files at project start? (in minutes)";
    			t14 = space();
    			input3 = element("input");
    			t15 = space();
    			label4 = element("label");
    			label4.textContent = "Internal collaboration before first draft? (hours per project)";
    			t17 = space();
    			input4 = element("input");
    			t18 = space();
    			label5 = element("label");
    			label5.textContent = "Time to send files for feedback each time (in minutes)";
    			t20 = space();
    			input5 = element("input");
    			t21 = space();
    			label6 = element("label");
    			label6.textContent = "Feedback loops per project before last client approval?";
    			t23 = space();
    			input6 = element("input");
    			t24 = space();
    			label7 = element("label");
    			label7.textContent = "Communication time with client per feedback loop? (in minutes)";
    			t26 = space();
    			input7 = element("input");
    			t27 = space();
    			label8 = element("label");
    			label8.textContent = "Communicate back to creative team? (in minutes)";
    			t29 = space();
    			input8 = element("input");
    			t30 = space();
    			label9 = element("label");
    			label9.textContent = "DAM cost";
    			t32 = space();
    			div2 = element("div");
    			label10 = element("label");
    			input9 = element("input");
    			t33 = text("\n                Swivle Team at ");
    			t34 = text(currency);
    			t35 = text("299/mo");
    			t36 = space();
    			label11 = element("label");
    			input10 = element("input");
    			t37 = text("\n                Swivle Organization at ");
    			t38 = text(currency);
    			t39 = text("799/mo");
    			t40 = space();
    			if_block.c();
    			h1.className = "svelte-1nz7tj7";
    			add_location(h1, file, 81, 8, 3527);
    			label0.className = "svelte-1nz7tj7";
    			add_location(label0, file, 82, 8, 3561);
    			input0.placeholder = input0_placeholder_value = ctx.initial.team;
    			attr(input0, "type", "number");
    			input0.min = "0";
    			input0.className = "svelte-1nz7tj7";
    			add_location(input0, file, 83, 8, 3616);
    			label1.className = "svelte-1nz7tj7";
    			add_location(label1, file, 84, 8, 3726);
    			input1.placeholder = input1_placeholder_value = ctx.initial.billable;
    			attr(input1, "type", "number");
    			input1.min = "0";
    			input1.className = "svelte-1nz7tj7";
    			add_location(input1, file, 86, 12, 3825);
    			div0.className = "roi-sign svelte-1nz7tj7";
    			add_location(div0, file, 87, 12, 3924);
    			div1.className = "roi-currency svelte-1nz7tj7";
    			add_location(div1, file, 85, 8, 3786);
    			label2.className = "svelte-1nz7tj7";
    			add_location(label2, file, 89, 8, 3986);
    			input2.placeholder = input2_placeholder_value = ctx.initial.projects;
    			attr(input2, "type", "number");
    			input2.min = "0";
    			input2.className = "svelte-1nz7tj7";
    			add_location(input2, file, 90, 8, 4035);
    			label3.className = "svelte-1nz7tj7";
    			add_location(label3, file, 91, 8, 4130);
    			input3.placeholder = input3_placeholder_value = ctx.initial.assembling;
    			attr(input3, "type", "number");
    			input3.min = "0";
    			input3.className = "svelte-1nz7tj7";
    			add_location(input3, file, 92, 8, 4220);
    			label4.className = "svelte-1nz7tj7";
    			add_location(label4, file, 93, 8, 4319);
    			input4.placeholder = input4_placeholder_value = ctx.initial.collaborating;
    			attr(input4, "type", "number");
    			input4.min = "0";
    			input4.className = "svelte-1nz7tj7";
    			add_location(input4, file, 94, 8, 4405);
    			label5.className = "svelte-1nz7tj7";
    			add_location(label5, file, 95, 8, 4510);
    			input5.placeholder = input5_placeholder_value = ctx.initial.sendFeedback;
    			attr(input5, "type", "number");
    			input5.min = "0";
    			input5.className = "svelte-1nz7tj7";
    			add_location(input5, file, 96, 8, 4588);
    			label6.className = "svelte-1nz7tj7";
    			add_location(label6, file, 97, 8, 4691);
    			input6.placeholder = input6_placeholder_value = ctx.initial.feedbackLoops;
    			attr(input6, "type", "number");
    			input6.min = "0";
    			input6.className = "svelte-1nz7tj7";
    			add_location(input6, file, 98, 8, 4770);
    			label7.className = "svelte-1nz7tj7";
    			add_location(label7, file, 99, 8, 4875);
    			input7.placeholder = input7_placeholder_value = ctx.initial.communicationClient;
    			attr(input7, "type", "number");
    			input7.min = "0";
    			input7.className = "svelte-1nz7tj7";
    			add_location(input7, file, 100, 8, 4961);
    			label8.className = "svelte-1nz7tj7";
    			add_location(label8, file, 101, 8, 5078);
    			input8.placeholder = input8_placeholder_value = ctx.initial.communicationInternal;
    			attr(input8, "type", "number");
    			input8.min = "0";
    			input8.className = "svelte-1nz7tj7";
    			add_location(input8, file, 102, 8, 5149);
    			label9.className = "svelte-1nz7tj7";
    			add_location(label9, file, 103, 8, 5270);
    			ctx.$$binding_groups[0].push(input9);
    			attr(input9, "type", "radio");
    			input9.__value = 299;
    			input9.value = input9.__value;
    			input9.className = "svelte-1nz7tj7";
    			add_location(input9, file, 106, 16, 5357);
    			label10.className = "svelte-1nz7tj7";
    			add_location(label10, file, 105, 12, 5333);
    			ctx.$$binding_groups[0].push(input10);
    			attr(input10, "type", "radio");
    			input10.__value = 799;
    			input10.value = input10.__value;
    			input10.className = "svelte-1nz7tj7";
    			add_location(input10, file, 110, 16, 5518);
    			label11.className = "svelte-1nz7tj7";
    			add_location(label11, file, 109, 12, 5494);
    			div2.className = "cost svelte-1nz7tj7";
    			add_location(div2, file, 104, 8, 5302);
    			div3.className = "roi-block svelte-1nz7tj7";
    			add_location(div3, file, 80, 4, 3454);
    			div4.className = "roi-wrapper svelte-1nz7tj7";
    			add_location(div4, file, 79, 0, 3424);

    			dispose = [
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(input1, "input", ctx.input1_input_handler),
    				listen(input2, "input", ctx.input2_input_handler),
    				listen(input3, "input", ctx.input3_input_handler),
    				listen(input4, "input", ctx.input4_input_handler),
    				listen(input5, "input", ctx.input5_input_handler),
    				listen(input6, "input", ctx.input6_input_handler),
    				listen(input7, "input", ctx.input7_input_handler),
    				listen(input8, "input", ctx.input8_input_handler),
    				listen(input9, "change", ctx.input9_change_handler),
    				listen(input10, "change", ctx.input10_change_handler),
    				listen(div3, "change", ctx.change_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div4, anchor);
    			append(div4, div3);
    			append(div3, h1);
    			append(div3, t1);
    			append(div3, label0);
    			append(div3, t3);
    			append(div3, input0);

    			input0.value = ctx.team;

    			add_binding_callback(() => ctx.input0_binding(input0, null));
    			append(div3, t4);
    			append(div3, label1);
    			append(div3, t6);
    			append(div3, div1);
    			append(div1, input1);

    			input1.value = ctx.billable;

    			append(div1, t7);
    			append(div1, div0);
    			append(div0, t8);
    			append(div3, t9);
    			append(div3, label2);
    			append(div3, t11);
    			append(div3, input2);

    			input2.value = ctx.projects;

    			append(div3, t12);
    			append(div3, label3);
    			append(div3, t14);
    			append(div3, input3);

    			input3.value = ctx.assembling;

    			append(div3, t15);
    			append(div3, label4);
    			append(div3, t17);
    			append(div3, input4);

    			input4.value = ctx.collaborating;

    			append(div3, t18);
    			append(div3, label5);
    			append(div3, t20);
    			append(div3, input5);

    			input5.value = ctx.sendFeedback;

    			append(div3, t21);
    			append(div3, label6);
    			append(div3, t23);
    			append(div3, input6);

    			input6.value = ctx.feedbackLoops;

    			append(div3, t24);
    			append(div3, label7);
    			append(div3, t26);
    			append(div3, input7);

    			input7.value = ctx.communicationClient;

    			append(div3, t27);
    			append(div3, label8);
    			append(div3, t29);
    			append(div3, input8);

    			input8.value = ctx.communicationInternal;

    			append(div3, t30);
    			append(div3, label9);
    			append(div3, t32);
    			append(div3, div2);
    			append(div2, label10);
    			append(label10, input9);

    			input9.checked = input9.__value === ctx.damCost;

    			append(label10, t33);
    			append(label10, t34);
    			append(label10, t35);
    			append(div2, t36);
    			append(div2, label11);
    			append(label11, input10);

    			input10.checked = input10.__value === ctx.damCost;

    			append(label11, t37);
    			append(label11, t38);
    			append(label11, t39);
    			append(div4, t40);
    			if_block.m(div4, null);
    		},

    		p: function update(changed, ctx) {
    			if (changed.team) input0.value = ctx.team;
    			if (changed.items) {
    				ctx.input0_binding(null, input0);
    				ctx.input0_binding(input0, null);
    			}
    			if (changed.billable) input1.value = ctx.billable;
    			if (changed.projects) input2.value = ctx.projects;
    			if (changed.assembling) input3.value = ctx.assembling;
    			if (changed.collaborating) input4.value = ctx.collaborating;
    			if (changed.sendFeedback) input5.value = ctx.sendFeedback;
    			if (changed.feedbackLoops) input6.value = ctx.feedbackLoops;
    			if (changed.communicationClient) input7.value = ctx.communicationClient;
    			if (changed.communicationInternal) input8.value = ctx.communicationInternal;
    			if (changed.damCost) input9.checked = input9.__value === ctx.damCost;
    			if (changed.damCost) input10.checked = input10.__value === ctx.damCost;

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(div4, null);
    				}
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div4);
    			}

    			ctx.input0_binding(null, input0);
    			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input9), 1);
    			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input10), 1);
    			if_block.d();
    			run_all(dispose);
    		}
    	};
    }

    let currency = "$";

    function instance($$self, $$props, $$invalidate) {
    	const qsInput = (new URLSearchParams(window.location.search).get("roi") || "").split("-");
        const initial = {
            team: parseInt(qsInput[0]) || 3,
            billable: parseInt(qsInput[1]) || 80,
            projects: parseInt(qsInput[2]) || 40,
            assembling: parseInt(qsInput[3]) || 30,
            collaborating: parseInt(qsInput[4]) || 2,
            sendFeedback: parseInt(qsInput[5]) || 15,
            feedbackLoops: parseInt(qsInput[6]) || 3,
            communicationClient: parseInt(qsInput[7]) || 30,
            communicationInternal: parseInt(qsInput[8]) || 15,
            damCost: parseInt(qsInput[9]) || 299
        };

        const decimalOptions = { style: "decimal", maximumFractionDigits: 1 };
        const integerOptions = { style: "decimal", maximumFractionDigits: 0 };
        const currencyOptions = { style: "currency", currency: "USD", maximumFractionDigits: 0, minimumFractionDigits: 0 };
        let showExplanation = qsInput.length < 2;
        let firstInput;
        let shareableLink;
        let linkCopyFeedback = false;

        let team = initial.team;
        let billable = initial.billable;
        let projects = initial.projects;
        let assembling = initial.assembling;
        let collaborating = initial.collaborating;
        let sendFeedback = initial.sendFeedback;
        let feedbackLoops = initial.feedbackLoops;
        let communicationClient = initial.communicationClient;
        let communicationInternal = initial.communicationInternal;
        let damCost = initial.damCost;
        function start() {
            $$invalidate('showExplanation', showExplanation = false);
            firstInput.focus();
            firstInput.select();
        }

        function copyLink(event) {
            event.preventDefault();
            navigator.clipboard.writeText(`${window.location.href}`);
            $$invalidate('linkCopyFeedback', linkCopyFeedback = true);
            setTimeout(() => { const $$result = linkCopyFeedback = false; $$invalidate('linkCopyFeedback', linkCopyFeedback); return $$result; }, 1500);
            return false;
        }

    	const $$binding_groups = [[]];

    	function input0_input_handler() {
    		team = to_number(this.value);
    		$$invalidate('team', team);
    	}

    	function input0_binding($$node, check) {
    		firstInput = $$node;
    		$$invalidate('firstInput', firstInput);
    	}

    	function input1_input_handler() {
    		billable = to_number(this.value);
    		$$invalidate('billable', billable);
    	}

    	function input2_input_handler() {
    		projects = to_number(this.value);
    		$$invalidate('projects', projects);
    	}

    	function input3_input_handler() {
    		assembling = to_number(this.value);
    		$$invalidate('assembling', assembling);
    	}

    	function input4_input_handler() {
    		collaborating = to_number(this.value);
    		$$invalidate('collaborating', collaborating);
    	}

    	function input5_input_handler() {
    		sendFeedback = to_number(this.value);
    		$$invalidate('sendFeedback', sendFeedback);
    	}

    	function input6_input_handler() {
    		feedbackLoops = to_number(this.value);
    		$$invalidate('feedbackLoops', feedbackLoops);
    	}

    	function input7_input_handler() {
    		communicationClient = to_number(this.value);
    		$$invalidate('communicationClient', communicationClient);
    	}

    	function input8_input_handler() {
    		communicationInternal = to_number(this.value);
    		$$invalidate('communicationInternal', communicationInternal);
    	}

    	function input9_change_handler() {
    		damCost = this.__value;
    		$$invalidate('damCost', damCost);
    	}

    	function input10_change_handler() {
    		damCost = this.__value;
    		$$invalidate('damCost', damCost);
    	}

    	function change_handler() {
    		const $$result = showExplanation = false;
    		$$invalidate('showExplanation', showExplanation);
    		return $$result;
    	}

    	let collaboratingProject, timeSendingApprovalsProject, feedbackCommunication, wastedHoursProject, opportunityCost, billableHoursYearly, revenueIncrease;

    	$$self.$$.update = ($$dirty = { assembling: 1, collaborating: 1, sendFeedback: 1, feedbackLoops: 1, communicationClient: 1, communicationInternal: 1, collaboratingProject: 1, timeSendingApprovalsProject: 1, feedbackCommunication: 1, wastedHoursProject: 1, billable: 1, team: 1, projects: 1, billableHoursYearly: 1, damCost: 1, shareableLink: 1 }) => {
    		if ($$dirty.assembling || $$dirty.collaborating) { $$invalidate('collaboratingProject', collaboratingProject = (assembling || initial.assembling) / 60 + (collaborating || initial.collaborating)); }
    		if ($$dirty.sendFeedback || $$dirty.feedbackLoops) { $$invalidate('timeSendingApprovalsProject', timeSendingApprovalsProject = ((sendFeedback || initial.sendFeedback) * (feedbackLoops || initial.feedbackLoops)) / 60); }
    		if ($$dirty.feedbackLoops || $$dirty.communicationClient || $$dirty.communicationInternal) { $$invalidate('feedbackCommunication', feedbackCommunication = ((feedbackLoops || initial.feedbackLoops) * (communicationClient || initial.communicationClient) + (feedbackLoops || initial.feedbackLoops) * (communicationInternal || initial.communicationInternal)) / 60); }
    		if ($$dirty.collaboratingProject || $$dirty.timeSendingApprovalsProject || $$dirty.feedbackCommunication) { $$invalidate('wastedHoursProject', wastedHoursProject = collaboratingProject + timeSendingApprovalsProject + feedbackCommunication); }
    		if ($$dirty.wastedHoursProject || $$dirty.billable || $$dirty.team) { $$invalidate('opportunityCost', opportunityCost = wastedHoursProject * (billable || initial.billable) * (team || initial.team)); }
    		if ($$dirty.wastedHoursProject || $$dirty.projects) { $$invalidate('billableHoursYearly', billableHoursYearly = wastedHoursProject * (projects || initial.projects)); }
    		if ($$dirty.billableHoursYearly || $$dirty.billable || $$dirty.team || $$dirty.damCost) { $$invalidate('revenueIncrease', revenueIncrease = billableHoursYearly * (billable || initial.billable) * (team || initial.team) - (damCost * 12)); }
    		if ($$dirty.team || $$dirty.billable || $$dirty.projects || $$dirty.assembling || $$dirty.collaborating || $$dirty.sendFeedback || $$dirty.feedbackLoops || $$dirty.communicationClient || $$dirty.communicationInternal || $$dirty.damCost || $$dirty.shareableLink) { {
                    const data = [
                        Math.abs(team),
                        Math.abs(billable),
                        Math.abs(projects),
                        Math.abs(assembling),
                        Math.abs(collaborating),
                        Math.abs(sendFeedback),
                        Math.abs(feedbackLoops),
                        Math.abs(communicationClient),
                        Math.abs(communicationInternal),
                        Math.abs(damCost)
                    ];
                    const qs = new URLSearchParams(window.location.search);
                    qs.set("roi", data.join("-"));
                    $$invalidate('shareableLink', shareableLink = `${window.location.pathname}?${qs.toString()}`);
                    history.replaceState(null, null, shareableLink);
                } }
    	};

    	return {
    		initial,
    		decimalOptions,
    		integerOptions,
    		currencyOptions,
    		showExplanation,
    		firstInput,
    		shareableLink,
    		linkCopyFeedback,
    		team,
    		billable,
    		projects,
    		assembling,
    		collaborating,
    		sendFeedback,
    		feedbackLoops,
    		communicationClient,
    		communicationInternal,
    		damCost,
    		start,
    		copyLink,
    		wastedHoursProject,
    		opportunityCost,
    		billableHoursYearly,
    		revenueIncrease,
    		input0_input_handler,
    		input0_binding,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler,
    		input6_input_handler,
    		input7_input_handler,
    		input8_input_handler,
    		input9_change_handler,
    		input10_change_handler,
    		change_handler,
    		$$binding_groups
    	};
    }

    class RoiCalculator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    const app = new RoiCalculator({
    	target: document.getElementById('roi-calculator')
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
