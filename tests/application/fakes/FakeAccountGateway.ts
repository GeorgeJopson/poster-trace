import { AccountDeletionRefusedError } from "@application/errors/AccountDeletionRefusedError";
import type { AccountGateway } from "@application/ports/AccountGateway";

export class FakeAccountGateway implements AccountGateway {
  /** When set, deletes are refused with this message. */
  refusal: string | null = null;
  deleteCount = 0;

  /** @param onDelete What deleting the account cascades to. */
  constructor(private readonly onDelete: () => void = () => {}) {}

  async deleteCurrentAccount(): Promise<void> {
    if (this.refusal !== null) {
      throw new AccountDeletionRefusedError(this.refusal);
    }
    this.deleteCount++;
    this.onDelete();
  }
}
