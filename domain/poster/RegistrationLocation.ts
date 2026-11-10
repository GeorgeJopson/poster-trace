import { ValidationError } from "../shared/ValidationError";

type RegistrationLocationProps = {
  latitude: number;
  longitude: number;
  /** In metres. */
  accuracy: number;
};

/** Where a poster was put up, exactly as the browser reported it. */
export class RegistrationLocation {
  readonly latitude: number;
  readonly longitude: number;
  /** In metres. */
  readonly accuracy: number;

  private constructor({
    latitude,
    longitude,
    accuracy,
  }: RegistrationLocationProps) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.accuracy = accuracy;
  }

  /**
   * Checks each value is a finite number, with latitude in -90..90, longitude
   * in -180..180 and a non-negative accuracy.
   */
  static create(props: RegistrationLocationProps): RegistrationLocation {
    const { latitude, longitude, accuracy } = props;
    const inRange = (value: number, min: number, max: number) =>
      Number.isFinite(value) && value >= min && value <= max;
    if (
      !inRange(latitude, -90, 90) ||
      !inRange(longitude, -180, 180) ||
      !inRange(accuracy, 0, Infinity)
    ) {
      throw new ValidationError(
        "The location isn't valid. Try getting it again, or register without it.",
      );
    }
    return new RegistrationLocation({ latitude, longitude, accuracy });
  }
}
