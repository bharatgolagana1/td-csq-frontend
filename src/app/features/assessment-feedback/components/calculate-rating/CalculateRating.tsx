export const calculateRating = (selectedOptions: boolean[]) => {
    const selectedCount = selectedOptions.filter((selected) => selected).length;
    if (selectedCount === 0) return 'Poor';
    if (selectedCount === 1) return 'Fair';
    if (selectedCount === 2) return 'Good';
    if (selectedCount === 3) return 'Very Good';
    if (selectedCount >= 4) return 'Excellent';
    return 'Poor';
  };
  