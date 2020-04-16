/* -*- js-indent-level: 8 -*- */
/*
 * L.Control.FormulaBar
 */

/* global $ w2ui _ */
L.Control.FormulaBar = L.Control.extend({
	options: {
		showfunctionwizard: true
	},

	onAdd: function (map) {
		this.map = map;
		this.create();

		map.on('doclayerinit', this.onDocLayerInit, this);
		map.on('updatepermission', this.onUpdatePermission, this);

		map.on('celladdress', function (e) {
			if (document.activeElement !== L.DomUtil.get('addressInput')) {
				// if the user is not editing the address field
				L.DomUtil.get('addressInput').value = e.address;
			}
		});
	},

	create: function() {
		var that = this;
		var toolbar = $('#formulabar');
		toolbar.w2toolbar({
			name: 'formulabar',
			tooltip: 'bottom',
			hidden: true,
			items: [
				{type: 'html',  id: 'left'},
				{type: 'html', id: 'address', html: '<input id="addressInput" type="text">'},
				{type: 'break', hidden: !this.options.showfunctionwizard},
				{type: 'button', hidden: !this.options.showfunctionwizard, id: 'functiondialog', img: 'functiondialog', hint: _('Function Wizard'), uno: '.uno:FunctionDialog'},
				{type: 'html', id: 'formula', html: '<div id="calc-inputbar-wrapper"><div id="calc-inputbar"></div></div>'}
			],
			onClick: function (e) {
				that.onClick(e, e.target);
				window.hideTooltip(this, e.target);
			},
			onRefresh: function() {
				$('#addressInput').off('keyup', this.onAddressInput, this).on('keyup', this.onAddressInput, this);
			}
		});
		toolbar.bind('touchstart', function(e) {
			w2ui['formulabar'].touchStarted = true;
			var touchEvent = e.originalEvent;
			if (touchEvent && touchEvent.touches.length > 1) {
				L.DomEvent.preventDefault(e);
			}
		});

		$(w2ui.formulabar.box).find('.w2ui-scroll-left, .w2ui-scroll-right').hide();
		w2ui.formulabar.on('resize', function(target, e) {
			e.isCancelled = true;
		});
	},

	onClick: function(e, id, item) {
		if ('formulabar' in w2ui && w2ui['formulabar'].get(id) !== null) {
			var toolbar = w2ui['formulabar'];
			item = toolbar.get(id);
		}

		// In the iOS app we don't want clicking on the toolbar to pop up the keyboard.
		if (!window.ThisIsTheiOSApp && id !== 'zoomin' && id !== 'zoomout' && id !== 'mobile_wizard' && id !== 'insertion_mobile_wizard') {
			this.map.focus(this.map.canAcceptKeyboardInput()); // Maintain same keyboard state.
		}

		if (item.disabled) {
			return;
		}

		if (item.uno) {
			if (item.unosheet && this.map.getDocType() === 'spreadsheet') {
				this.map.toggleCommandState(item.unosheet);
			}
			else {
				this.map.toggleCommandState(window.getUNOCommand(item.uno));
			}
		}
	},

	onDocLayerInit: function() {
		var docType = this.map.getDocType();
		if (docType == 'spreadsheet') {
			$('#formulabar').show();
		}
	},

	onUpdatePermission: function(e) {
		var formulaBarButtons = ['functiondialog', 'sum', 'function'];
		var toolbar = w2ui.formulabar;

		if (e.perm === 'edit') {
			// Enable formula bar
			$('#addressInput').prop('disabled', false);
			$('#formulaInput').prop('disabled', false);

			if (toolbar) {
				formulaBarButtons.forEach(function(id) {
					toolbar.enable(id);
				});
			}
		} else {
			// Disable formula bar
			$('#addressInput').prop('disabled', true);
			$('#formulaInput').prop('disabled', true);

			if (toolbar) {
				formulaBarButtons.forEach(function(id) {
					toolbar.disable(id);
				});
			}
		}
	},

	onAddressInput: function(e) {
		if (e.keyCode === 13) {
			// address control should not have focus anymore
			this.map.focus();
			var value = L.DomUtil.get('addressInput').value;
			var command = {
				ToPoint : {
					type: 'string',
					value: value
				}

			};
			this.map.sendUnoCommand('.uno:GoToCell', command);
		} else if (e.keyCode === 27) { // 27 = esc key
			this.map.sendUnoCommand('.uno:Cancel');
			this.map.focus();
		}
	}
});

L.control.formulaBar = function (options) {
	return new L.Control.FormulaBar(options);
};