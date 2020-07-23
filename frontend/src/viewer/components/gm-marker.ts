import { customElement, internalProperty, LitElement, property } from 'lit-element';
import { connect } from 'pwa-helpers';

import { RuntimeTrack } from '../../../../common/track';
import { setCurrentTrack } from '../actions/map';
import { trackColor } from '../logic/map';
import { sampleAt } from '../logic/math';
import { formatUnit } from '../logic/units';
import { tsOffsets } from '../selectors/map';
import { RootState, store } from '../store';

const INACTIVE_OPACITY = 0.7;

@customElement('gm-marker')
export class GmMarkerElement extends connect(store)(LitElement) {
  @property()
  map: google.maps.Map | null = null;

  @property()
  timestamp = 0;

  @property()
  track: RuntimeTrack | null = null;

  @property()
  active = false;

  @property()
  index = 0;

  @internalProperty()
  units: any = null;

  @internalProperty()
  displayNames = true;

  protected tsOffsets: number[] = [];

  protected marker: google.maps.Marker | null = null;

  stateChanged(state: RootState): void {
    if (state.map) {
      this.tsOffsets = tsOffsets(state.map);
      this.units = state.map.units;
      this.displayNames = state.map.displayNames;
    }
  }

  shouldUpdate(): boolean {
    if (this.map && this.track) {
      const track = this.track;
      if (!this.marker) {
        this.marker = new google.maps.Marker({
          map: this.map,
          clickable: true,
          title: track.name,
        });
        google.maps.event.addListener(this.marker, 'click', () => {
          store.dispatch(setCurrentTrack(this.index));
        });
      }
      const timestamp = this.timestamp + this.tsOffsets[this.index];
      const lat = sampleAt(track.fixes.ts, track.fixes.lat, [timestamp])[0];
      const lon = sampleAt(track.fixes.ts, track.fixes.lon, [timestamp])[0];
      const alt = sampleAt(track.fixes.ts, track.fixes.alt, [timestamp])[0];
      const scale = (50 * (alt - track.minAlt)) / (track.maxAlt - track.minAlt) + 20;
      this.marker.setPosition({ lat, lng: lon });
      this.marker.setIcon({
        path:
          'M390 169.3c-20.1 7.3-31.9 16.2-35.5 19.2C342.4 252 310.7 274 286 281a5.4 5.4 0 0 1-6.8-4.1c-.2-.7-.2-.9.2-25.3l-12.3 8.4c-1 .7-2.3 1-3.5 1h-15.4c-1.2 0-2.5-.3-3.5-1l-12.3-8.4c.4 24.4.3 24.6.2 25.3a5.4 5.4 0 0 1-6.8 4.1c-24.6-7.1-56.3-29-68.4-92.5-3.6-3-15.4-11.9-35.6-19.2-21-7.5-55.2-14.6-102.7-8.2a118.3 118.3 0 0 1 41 93.2 101 101 0 0 1 34.8 6.6c18 7 40.5 22.6 50.3 57.3 10.9-8.7 27.8-12.6 53.8-12.6a60.8 60.8 0 0 1 48 22.5 72 72 0 0 1 8.8 13.5c2.3-4.5 5.3-9.2 8.9-13.5a60.8 60.8 0 0 1 48-22.5c26 0 43 4 54 12.7A82.2 82.2 0 0 1 417 261a101 101 0 0 1 34.8-6.6 118.3 118.3 0 0 1 41-93.2c-47.5-6.4-81.8.7-102.7 8.2z',
        fillColor: trackColor(this.index),
        fillOpacity: this.active ? 1 : INACTIVE_OPACITY,
        strokeColor: '#000',
        strokeWeight: 2,
        labelOrigin: new google.maps.Point(256, 460),
        anchor: new google.maps.Point(256, 330),
        scale: scale / 512,
      });
      // Display higher markers on top.
      this.marker.setZIndex(Math.floor(alt));
      const label = this.displayNames
        ? {
            color: 'black',
            fontWeight: '500',
            // "14.001px" is a hack to be able to style the labels with a `div[style*='14.001px']` selector.
            fontSize: '14.001px',
            text: `${track.name} · ${formatUnit(alt, this.units.altitude)}`,
          }
        : '';
      this.marker.setLabel(label);
    }
    return false;
  }

  disconnectedCallback(): void {
    if (this.marker) {
      this.marker.setMap(null);
      this.marker = null;
    }
  }

  // There is not content - no need to create a shadow root.
  createRenderRoot(): Element {
    return this;
  }
}
