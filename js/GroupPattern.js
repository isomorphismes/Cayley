// @flow

/*
 * Bridge between display-neutral finite-group structure and the 2D
 * PatternLanguage frontend.
 *
 * A finite subgroup of the Euclidean isometry group of the plane is cyclic or
 * dihedral (up to conjugacy).  GroupStructure recognizes those actions from
 * multiplication alone.  This file only compiles a recognized action into the
 * current pattern language; it does not own group parsing or group arithmetic.
 */

import {
    GroupStructureError,
    finiteGroupFromGroupExplorerData,
    planarActionForGroup as structuralPlanarActionForGroup,
} from './GroupStructure.js';

export class GroupPatternError extends Error {
    constructor (message) {
        super(message);
        this.name = 'GroupPatternError';
    }
}

function cleanLabel (label) {
    return String(label == null ? 'Selected group' : label).replace(/\s+/g, ' ').trim();
}

function asPatternError (error) {
    if (error instanceof GroupPatternError) {
        return error;
    }
    if (error instanceof GroupStructureError || error instanceof Error) {
        return new GroupPatternError(error.message);
    }
    return new GroupPatternError(String(error));
}

export function groupFromGroupExplorerData (source, fallback_name = 'Selected group') {
    try {
        return finiteGroupFromGroupExplorerData(source, fallback_name);
    } catch (error) {
        throw asPatternError(error);
    }
}

export function planarActionForGroup (group) {
    try {
        return structuralPlanarActionForGroup(group);
    } catch (error) {
        throw asPatternError(error);
    }
}

function unsupportedMessage (group) {
    const label = cleanLabel(group == null ? null : group.shortName);
    return `${label} has no faithful finite Euclidean-plane action in the current 2D pattern IR. ` +
        'Finite planar point groups are cyclic or dihedral; other groups need a 3D or explicitly non-faithful action.';
}

export function patternSourceForGroup (group) {
    const action = planarActionForGroup(group);
    if (action == null) {
        throw new GroupPatternError(unsupportedMessage(group));
    }

    const label = cleanLabel(group.shortName);
    const lines = [
        `# Generated from Group Explorer group ${label}`,
        `# element ${action.rotationElement} -> rotation of order ${action.rotationOrder}`,
    ];
    if (action.kind === 'dihedral') {
        lines.push(`# element ${action.reflectionElement} -> reflection`);
    }

    lines.push(
        'canvas 720 720',
        'viewport -160 -160 160 160',
        'background transparent',
        'stroke currentColor 3',
        'fill none',
        '',
        'motif seed',
        '    move 52 -18',
        '    line 126 -8',
        '    line 88 31',
        '    line 55 10',
        '    close',
        '    circle 108 11 5',
        'end',
        ''
    );

    if (action.rotationOrder > 1) {
        const degrees = Number((360 / action.rotationOrder).toFixed(12));
        lines.push(`generator group_turn rotate ${degrees}`);
    }
    if (action.kind === 'dihedral') {
        lines.push('generator group_mirror reflect 0 0 1 0');
    }
    lines.push(`orbit seed ${action.orbitSize}`, '');

    return lines.join('\n');
}
