import { css, CSSResult, customElement, html, internalProperty, LitElement, TemplateResult } from 'lit-element';
import { connect } from 'pwa-helpers';

import { RuntimeFixes, RuntimeTrack } from '../../../../common/track';
import { closeActiveTrack, setCurrentTrack, setDisplayNames } from '../actions/map';
import { deleteUrlParamValue, ParamNames, pushCurrentState } from '../logic/history';
import { Units } from '../reducers/map';
import * as mapSel from '../selectors/map';
import { dispatch, RootState, store } from '../store';
import { AboutElement } from './about-element';
import { AirspaceCtrlElement } from './airspace-element';
import { AirwaysCtrlElement, AirwaysOverlay } from './airways-element';
import { DashboardElement } from './dashboard-element';
import { ExpandElement } from './expand-element';
import { NameElement } from './name-element';
import { PathCtrlElement } from './path-element';
import { PreferencesElement } from './preferences-element';
import { TrackingElement } from './tracking-element';
import { UploadElement } from './upload-element';

export {
  AboutElement,
  AirspaceCtrlElement,
  AirwaysCtrlElement,
  AirwaysOverlay,
  DashboardElement,
  ExpandElement,
  NameElement,
  PathCtrlElement,
  PreferencesElement,
  TrackingElement,
  UploadElement,
};

@customElement('controls-element')
export class ControlsElement extends connect(store)(LitElement) {
  @internalProperty()
  map: google.maps.Map | null = null;

  @internalProperty()
  timestamp = 0;

  @internalProperty()
  fixes: RuntimeFixes | null = null;

  @internalProperty()
  name: string | null = null;

  @internalProperty()
  tracks: RuntimeTrack[] | null = null;

  @internalProperty()
  units: Units | null = null;

  @internalProperty()
  currentTrackIndex: number | null = null;

  isInIframe = window.parent !== window;

  stateChanged(state: RootState): void {
    if (state.map) {
      this.map = state.map.map;
      this.timestamp = state.map.ts;
      this.fixes = mapSel.activeFixes(state.map);
      this.name = mapSel.name(state.map);
      this.tracks = mapSel.tracks(state.map);
      this.units = state.map.units;
      this.currentTrackIndex = state.map.currentTrackIndex;
    }
  }

  static get styles(): CSSResult[] {
    return [
      css`
        :host {
          display: block;
          font: 12px 'Nobile', verdana, sans-serif;
          height: 1px;
        }
      `,
    ];
  }

  // Closes the current track.
  protected handleClose(): void {
    if (this.currentTrackIndex == null || this.tracks == null) {
      return;
    }
    const id = this.tracks[this.currentTrackIndex].id;
    if (id != null) {
      pushCurrentState();
      deleteUrlParamValue(ParamNames.TRACK_ID, String(id));
    }
    dispatch(closeActiveTrack());
  }

  // Activates the next track.
  protected handleNext(): void {
    if (this.currentTrackIndex != null && this.tracks != null) {
      const index = (this.currentTrackIndex + 1) % this.tracks.length;
      dispatch(setCurrentTrack(index));
    }
  }

  // Shows/Hides pilot names next to the marker.
  protected handleDisplayNames(e: CustomEvent): void {
    dispatch(setDisplayNames(e.detail));
  }

  protected render(): TemplateResult {
    return html`
      ${this.isInIframe ? html`<expand-ctrl-element .map=${this.map}></expand-ctrl-element>` : html``}
      <airspace-ctrl-element .map=${this.map}></airspace-ctrl-element>
      <airways-ctrl-element .map=${this.map}></airways-ctrl-element>
      <path-ctrl-element .map=${this.map}></path-ctrl-element>
      <upload-ctrl-element></upload-ctrl-element>
      <tracking-element .map=${this.map}></tracking-element>
      <preferences-ctrl-element></preferences-ctrl-element>
      <about-ctrl-element></about-ctrl-element>
      ${this.name
        ? html`
            <name-ctrl-element
              .name=${this.name}
              .index=${this.currentTrackIndex}
              .nbtracks=${this.tracks?.length || 0}
              @closeActiveTrack=${this.handleClose}
              @selectNextTrack=${this.handleNext}
              @displayNames=${(e: CustomEvent) => this.handleDisplayNames(e)}
            ></name-ctrl-element>
          `
        : ''}
      ${this.fixes
        ? html`
            <dashboard-ctrl-element
              .fixes=${this.fixes}
              .timestamp=${this.timestamp}
              .units=${this.units}
            ></dashboard-ctrl-element>
          `
        : ''}
    `;
  }
}
