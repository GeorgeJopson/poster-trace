import { ValidationError } from "../shared/ValidationError";

type RegistrationLocationProps = {
  latitude: number;
  longitude: number;
};

/**
 * Where the person registering a poster says it is. They confirm the spot on
 * a map, so it can differ from where their browser placed them (ADR-0022).
 */
export class RegistrationLocation {
  readonly latitude: number;
  readonly longitude: number;

  private constructor({ latitude, longitude }: RegistrationLocationProps) {
    this.latitude = latitude;
    this.longitude = longitude;
  }

  /**
   * Checks each value is a finite number, with latitude in -90..90 and
   * longitude in -180..180.
   */
  static create(props: RegistrationLocationProps): RegistrationLocation {
    const { latitude, longitude } = props;
    const inRange = (value: number, min: number, max: number) =>
      Number.isFinite(value) && value >= min && value <= max;
    if (!inRange(latitude, -90, 90) || !inRange(longitude, -180, 180)) {
      throw new ValidationError(
        "The location isn't valid. Use your location again, or register without it.",
      );
    }
    return new RegistrationLocation({ latitude, longitude });
  }
}
