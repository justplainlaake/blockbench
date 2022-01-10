
class Locator extends OutlinerElement {
	constructor(data, uuid) {
		super(data, uuid);

		for (var key in Locator.properties) {
			Locator.properties[key].reset(this);
		}

		if (data) {
			this.extend(data);
		}
	}
	get origin() {
		return this.from;
	}
	extend(object) {
		for (var key in Locator.properties) {
			Locator.properties[key].merge(this, object)
		}
		this.sanitizeName();
		Merge.boolean(this, object, 'export');
		return this;
	}
	getUndoCopy() {
		var copy = new Locator(this)
		copy.uuid = this.uuid
		copy.type = this.type;
		delete copy.parent;
		return copy;
	}
	getSaveCopy() {
		let save = {};
		for (var key in Locator.properties) {
			Locator.properties[key].copy(this, save)
		}
		save.export = this.export ? undefined : false;
		save.uuid = this.uuid;
		save.type = 'locator';
		return save;
	}
	init() {
		if (this.parent instanceof Group == false) {
			this.addTo(Group.selected)
		}
		super.init();
		return this;
	}
	flip(axis, center) {
		var offset = this.from[axis] - center
		this.from[axis] = center - offset;
		this.rotation.forEach((n, i) => {
			if (i != axis) this.rotation[i] = -n;
		})
		// Name
		if (axis == 0 && this.name.includes('right')) {
			this.name = this.name.replace(/right/g, 'left').replace(/2$/, '');
		} else if (axis == 0 && this.name.includes('left')) {
			this.name = this.name.replace(/left/g, 'right').replace(/2$/, '');
		}
		this.createUniqueName();
		return this;
	}
	getWorldCenter() {
		var pos = Reusable.vec1.set(0, 0, 0);
		var q = Reusable.quat1.set(0, 0, 0, 1);
		if (this.parent instanceof Group) {
			THREE.fastWorldPosition(this.parent.mesh, pos);
			this.parent.mesh.getWorldQuaternion(q);
			var offset2 = Reusable.vec2.fromArray(this.parent.origin).applyQuaternion(q);
			pos.sub(offset2);
		}
		var offset = Reusable.vec3.fromArray(this.from).applyQuaternion(q);
		pos.add(offset);

		return pos;
	}
}
	Locator.prototype.title = tl('data.locator');
	Locator.prototype.type = 'locator';
	Locator.prototype.icon = 'fa fa-anchor';
	Locator.prototype.name_regex = 'a-z0-9_'
	Locator.prototype.movable = true;
	Locator.prototype.rotatable = true;
	Locator.prototype.visibility = true;
	Locator.prototype.buttons = [
		Outliner.buttons.export,
		Outliner.buttons.locked,
	];
	Locator.prototype.needsUniqueName = true;
	Locator.prototype.menu = new Menu([
			{
				id: 'ignore_inherited_scale',
				name: 'menu.locator.ignore_inherited_scale',
				icon: locator => locator.ignore_inherited_scale ? 'check_box' : 'check_box_outline_blank',
				click(clicked_locator) {
					let value = !clicked_locator.ignore_inherited_scale;
					let affected = Locator.selected.filter(locator => locator.ignore_inherited_scale != value);
					Undo.initEdit({elements: affected});
					affected.forEach(locator => {
						locator.ignore_inherited_scale = value;
					})
					Undo.finishEdit('Change locator ignore inherit scale option');
				}
			},
			'_',
			'group_elements',
			'_',
			'copy',
			'paste',
			'duplicate',
			'_',
			'rename',
			'delete'
		])
	
new Property(Locator, 'string', 'name', {default: 'locator'})
new Property(Locator, 'vector', 'from')
new Property(Locator, 'vector', 'rotation')
new Property(Locator, 'boolean', 'ignore_inherited_scale')
new Property(Locator, 'boolean', 'locked');

OutlinerElement.registerType(Locator, 'locator');

new NodePreviewController(Locator)

BARS.defineActions(function() {
	new Action('add_locator', {
		icon: 'fa-anchor',
		category: 'edit',
		condition: () => {return Format.locators && Modes.edit},
		click: function () {
			var objs = []
			Undo.initEdit({elements: objs, outliner: true});
			var locator = new Locator().addTo(Group.selected||selected[0]).init();
			locator.select().createUniqueName();
			objs.push(locator);
			Undo.finishEdit('Add locator');
			Vue.nextTick(function() {
				if (settings.create_rename.value) {
					locator.rename();
				}
			})
		}
	})
})
