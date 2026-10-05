import { Transaction } from "@/app/types/transaction";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateTransaction } from "@/features/transaction/action";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Dispatch, SetStateAction, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const fromSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  type: z.enum(["income", "expense"], {
    error: "Type is required",
  }),
  category: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
});

export default function UpdateTransactionDialog({
  selectedTransaction,
  setSelectedTransaction,
  refetch,
}: {
  selectedTransaction: {
    data: Omit<Transaction, "user_id" | "embedding">;
    action: "edit" | "delete";
  } | null;
  setSelectedTransaction: Dispatch<
    SetStateAction<{
      data: Omit<Transaction, "user_id" | "embedding">;
      action: "edit" | "delete";
    } | null>
  >;
  refetch: () => void;
}) {
  const form = useForm<z.infer<typeof fromSchema>>({
    resolver: zodResolver(fromSchema),
    mode: "onChange",
    defaultValues: {
      amount: selectedTransaction
        ? String(selectedTransaction.data.amount)
        : "",
      type: selectedTransaction ? selectedTransaction.data.type : "income",
      category: selectedTransaction ? selectedTransaction.data.category : "",
      date: selectedTransaction ? String(selectedTransaction.data.date) : "",
      description: selectedTransaction
        ? selectedTransaction.data.description
        : "",
    },
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: z.infer<typeof fromSchema>;
    }) => {
      const formattedData = {
        ...data,
        amount: Number(data.amount),
      };

      return updateTransaction(id, formattedData);
    },
    onSuccess: async () => {
      setSelectedTransaction(null);
      await refetch();
      form.reset();
      toast.success("Transaction update successfully");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update transaction",
      );
    },
  });

  useEffect(() => {
    if (selectedTransaction) {
      form.reset({
        amount: String(selectedTransaction.data.amount),
        type: selectedTransaction.data.type,
        category: selectedTransaction.data.category,
        date: String(selectedTransaction.data.date),
        description: selectedTransaction.data.description,
      });
    }
  }, [form, selectedTransaction]);

  const onSubmit = (data: z.infer<typeof fromSchema>) => {
    if (selectedTransaction?.action !== "edit") return;

    mutate({
      id: selectedTransaction.data.id,
      data,
    });
  };

  return (
    <Dialog
      open={selectedTransaction?.action === "edit"}
      onOpenChange={(open) => {
        if (!open && !isPending) setSelectedTransaction(null);
      }}
    >
      <DialogContent className="gap-4" showCloseButton={!isPending}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader className="gap-4">
            <div>
              <DialogTitle>Update Transaction</DialogTitle>
              <DialogDescription>
                Update the transaction data below
              </DialogDescription>
            </div>
            <FieldGroup className="gap-3">
              <Controller
                control={form.control}
                name="amount"
                render={({ field, fieldState }) => (
                  <Field className="gap-1">
                    <FieldLabel htmlFor="update-form-amount">Amount</FieldLabel>
                    <Input
                      {...field}
                      id="update-form-amount"
                      placeholder="0,00"
                      autoComplete="off"
                      type="number"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="type"
                render={({ field, fieldState }) => (
                  <Field className="gap-1">
                    <FieldLabel htmlFor="update-form-type">Type</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="update-form-type" className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="category"
                render={({ field, fieldState }) => (
                  <Field className="gap-1">
                    <FieldLabel htmlFor="update-form-category">
                      Category
                    </FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger
                        id="update-form-category"
                        className="w-full"
                      >
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Food & Drink">
                          Food & Drink
                        </SelectItem>
                        <SelectItem value="Transport">Transport</SelectItem>
                        <SelectItem value="Entertainment">
                          Entertainment
                        </SelectItem>
                        <SelectItem value="Shopping">Shopping</SelectItem>
                        <SelectItem value="Housing">Housing</SelectItem>
                        <SelectItem value="Salary">Salary</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="date"
                render={({ field, fieldState }) => (
                  <Field className="gap-1">
                    <FieldLabel htmlFor="update-form-date">Date</FieldLabel>
                    <DatePicker
                      id="update-form-date"
                      value={field.value ? parseISO(field.value) : undefined}
                      onChange={(date) =>
                        field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                      }
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <Field className="gap-1">
                    <FieldLabel htmlFor="update-form-description">
                      Description
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="update-form-description"
                      placeholder="Enter description"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error.message}
                </p>
              )}
            </FieldGroup>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSelectedTransaction(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              size="lg"
              type="submit"
              disabled={!form.formState.isValid || isPending}
            >
              {isPending ? "Updating..." : "Update Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
