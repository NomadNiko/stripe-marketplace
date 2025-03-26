"use client";
import { useState } from "react";
import { useForm, FormProvider, Controller, Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslation } from "@/services/i18n/client";
import { useBusinessRegister } from "@/services/api/services/business";
import { useRouter } from "next/navigation";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import {
  Button,
  Stack,
  Box,
  TextInput,
  Textarea,
  Text,
  Paper,
} from "@mantine/core";
import FormAvatarInput from "@/components/form/avatar-input/form-avatar-input";
import useGlobalLoading from "@/services/loading/use-global-loading";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { FileEntity } from "@/services/api/types/file-entity";

export type BusinessRegistrationFormData = {
  // User data
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  // Business data
  business: {
    displayName: string;
    businessName: string;
    description: string;
    logo?: FileEntity | null;
    website?: string;
    phone?: string;
  };
};

export function BusinessRegistrationForm() {
  const { t } = useTranslation("business");
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { setLoading } = useGlobalLoading();
  const businessRegister = useBusinessRegister();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define validation schema
  const validationSchema = yup.object().shape({
    // User validation
    email: yup
      .string()
      .email(t("register.validation.email.invalid"))
      .required(t("register.validation.email.required")),
    password: yup
      .string()
      .min(6, t("register.validation.password.min"))
      .required(t("register.validation.password.required")),
    firstName: yup
      .string()
      .required(t("register.validation.firstName.required")),
    lastName: yup.string().required(t("register.validation.lastName.required")),
    // Business validation
    business: yup.object().shape({
      displayName: yup
        .string()
        .required(t("register.validation.displayName.required"))
        .min(3, t("register.validation.displayName.min"))
        .max(30, t("register.validation.displayName.max"))
        .matches(
          /^[a-z0-9]+(-[a-z0-9]+)*$/,
          t("register.validation.displayName.format")
        ),
      businessName: yup
        .string()
        .required(t("register.validation.businessName.required"))
        .min(2, t("register.validation.businessName.min"))
        .max(100, t("register.validation.businessName.max")),
      description: yup
        .string()
        .max(500, t("register.validation.description.max")),
      website: yup
        .string()
        .nullable()
        .transform((v) => (v === "" ? null : v))
        .notRequired()
        .test("is-url", t("register.validation.website.url"), function (value) {
          if (!value) return true;
          return yup.string().url().isValidSync(value);
        }),
      phone: yup
        .string()
        .nullable()
        .transform((v) => (v === "" ? null : v))
        .notRequired(),
    }),
  });

  const methods = useForm<BusinessRegistrationFormData>({
    resolver: yupResolver(
      validationSchema
    ) as Resolver<BusinessRegistrationFormData>,
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      business: {
        displayName: "",
        businessName: "",
        description: "",
        website: "",
        phone: "",
        logo: null,
      },
    },
  });

  const { handleSubmit, setError, control } = methods;

  const onSubmit = async (data: BusinessRegistrationFormData) => {
    setIsSubmitting(true);
    setLoading(true);
    try {
      const response = await businessRegister(data);
      if (response.status === HTTP_CODES_ENUM.NO_CONTENT) {
        enqueueSnackbar(t("register.alerts.success"), {
          variant: "success",
        });
        router.push("/sign-in?from=business-register");
      } else if (response.status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        if (response.data.errors.email) {
          setError("email", {
            type: "manual",
            message: t(
              `register.validation.email.${response.data.errors.email}`
            ),
          });
        }
        if (response.data.errors["business.displayName"]) {
          setError("business.displayName", {
            type: "manual",
            message: t(
              `register.validation.displayName.${response.data.errors["business.displayName"]}`
            ),
          });
        }
      }
    } catch (error) {
      enqueueSnackbar(t("register.alerts.error"), {
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="lg">
          <Paper shadow="xs" p="md" withBorder>
            <Text fw={600} mb="md">
              {t("register.sections.userDetails")}
            </Text>
            <Stack gap="md">
              <Controller
                name="email"
                control={control}
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    label={t("register.fields.email")}
                    placeholder="example@company.com"
                    error={fieldState.error?.message}
                    data-testid="email"
                  />
                )}
              />
              <Controller
                name="password"
                control={control}
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    type="password"
                    label={t("register.fields.password")}
                    error={fieldState.error?.message}
                    data-testid="password"
                  />
                )}
              />
              <Controller
                name="firstName"
                control={control}
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    label={t("register.fields.firstName")}
                    error={fieldState.error?.message}
                    data-testid="firstName"
                  />
                )}
              />
              <Controller
                name="lastName"
                control={control}
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    label={t("register.fields.lastName")}
                    error={fieldState.error?.message}
                    data-testid="lastName"
                  />
                )}
              />
            </Stack>
          </Paper>
          <Paper shadow="xs" p="md" withBorder>
            <Text fw={600} mb="md">
              {t("register.sections.businessDetails")}
            </Text>
            <Stack gap="md">
              <FormAvatarInput<BusinessRegistrationFormData>
                name="business.logo"
                testId="business-logo"
              />
              <Controller
                name="business.businessName"
                control={control}
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    label={t("register.fields.businessName")}
                    placeholder={t("register.placeholders.businessName")}
                    error={fieldState.error?.message}
                    data-testid="businessName"
                  />
                )}
              />
              <Controller
                name="business.displayName"
                control={control}
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    label={t("register.fields.displayName")}
                    placeholder={t("register.placeholders.displayName")}
                    description={t("register.displayNameHelp")}
                    error={fieldState.error?.message}
                    data-testid="displayName"
                  />
                )}
              />
              <Controller
                name="business.description"
                control={control}
                render={({ field, fieldState }) => (
                  <Textarea
                    {...field}
                    label={t("register.fields.description")}
                    placeholder={t("register.placeholders.description")}
                    error={fieldState.error?.message}
                    minRows={3}
                    data-testid="description"
                  />
                )}
              />
              <Controller
                name="business.website"
                control={control}
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    label={t("register.fields.website")}
                    placeholder="https://example.com"
                    error={fieldState.error?.message}
                    data-testid="website"
                  />
                )}
              />
              <Controller
                name="business.phone"
                control={control}
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    label={t("register.fields.phone")}
                    placeholder="+1234567890"
                    error={fieldState.error?.message}
                    data-testid="phone"
                  />
                )}
              />
            </Stack>
          </Paper>
          <Box>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="register-submit"
              size="compact-sm"
            >
              {t("register.actions.submit")}
            </Button>
            <Button
              variant="subtle"
              component="a"
              href="/sign-in"
              ml="md"
              disabled={isSubmitting}
              data-testid="back-to-login"
              size="compact-sm"
            >
              {t("register.actions.backToLogin")}
            </Button>
          </Box>
        </Stack>
      </form>
    </FormProvider>
  );
}
