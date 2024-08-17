"use client";

import { FC, useEffect, useState, useRef, FormEvent } from "react";
import "./index.scss";
import { useStore } from "@/features/store";
import { useShallow } from "zustand/react/shallow";
import StellarSdk from "stellar-sdk";
import { IAccount } from "@/shared/types";
import { useRouter } from "next/navigation";

type AccountType = "Personal" | "Corporate";

const AddAccountModal: FC = () => {
  const [accountType, setAccountType] = useState<AccountType>("Personal");
  const [accountIdInput, setAccountIdInput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { setIsOpenAddAccountModal, net, accounts, setAccounts, setIsAuth, theme } =
    useStore(useShallow((state) => state));

  const handleAccountTypeChange = (type: AccountType) => {
    setAccountType(type);
  };
  
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Проверяем валидность публичного ключа
    if (StellarSdk.StrKey.isValidEd25519PublicKey(accountIdInput)) {
      // Проверка на наличие аккаунта в текущей сети
      const accountExistsInCurrentNet = accounts
        .filter((account) => account.net === net)
        .map((account) => account.accountID)
        .includes(accountIdInput);

      if (accountExistsInCurrentNet) {
        setError(`Account already exists`);

        return;
      }

      // Убираем статус isCurrent только для аккаунтов в текущей сети
      const updatedAccounts = accounts.map((account) =>
        account.net === net ? { ...account, isCurrent: false } : account
      );

      // Создаем новый аккаунт
      const newAccount: IAccount = {
        id: (accounts.length + 1).toString(),
        accountID: accountIdInput,
        net: net,
        isMultiSig: accountType === "Corporate",
        isCurrent: true,
      };

      // Обновляем список аккаунтов и добавляем новый
      setAccounts([...updatedAccounts, newAccount]);

      // Очищаем ошибки и закрываем модалку
      setError("");
      setIsOpenAddAccountModal(false);

      // Устанавливаем статус авторизованного пользователя
      setIsAuth(true);

      router.push(`/${net}/account?id=${accountIdInput}`);

    } else {
      setError("Invalid account ID");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsOpenAddAccountModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpenAddAccountModal]);

  return (
    <div className={theme === "night" ? "add-account-container" : "add-account-container-light"}>
      <div className={theme === "night" ? "add-account-container-content" : "add-account-container-content-light"} ref={modalRef}>
        <form onSubmit={handleSubmit}>
          <span
            onClick={() => setIsOpenAddAccountModal(false)}
            className={theme === "night" ? "add-account-container-content-close" : "add-account-container-content-close-light"}
            aria-label="Close"
          >
            <i
              className="fa-regular fa-circle-xmark"
              style={{ fontSize: "2rem", color: theme === "night" ? "#08b5e5" : "#666" }}
            />
          </span>
          <div className={theme === "night" ? "add-account-container-content-title" : "add-account-container-content-title-light"}>
            {["Personal", "Corporate"].map((type) => (
              <button
                key={type}
                type="button"
                className={accountType === type ? "button disabled add-account-container-content-button-disabled" : "button"}
                onClick={() => handleAccountTypeChange(type as AccountType)}
              >
                {type}
              </button>
            ))}
          </div>
          <div>
            <input
              type="text"
              placeholder="Account ID"
              value={accountIdInput}
              onChange={(e) => setAccountIdInput(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-center">
            <button className="button" type="submit">
              Add
            </button>
          </div>
          {error && (
            <div>
              <p className="text-center" style={{ color: "red" }}>
                {error}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddAccountModal;