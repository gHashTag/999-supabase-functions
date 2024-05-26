interface PathContext {
  isSubtopic: boolean;
  path: string;
}

function pathIncrement(ctx: PathContext) {
  const { isSubtopic, path } = ctx;

  // Разбиваем путь на части
  const parts = path.split("_");
  let major = parseInt(parts[1], 10);
  let minor = parseInt(parts[2], 10);
  console.log(parts, "parts");
  console.log(major, "major");
  console.log(minor, "minor");
  console.log(isSubtopic, "isSubtopic");
  // Инкрементируем соответствующую часть
  if (isSubtopic) {
    minor += 1;
  } else {
    major += 1;
    minor = 1; // Сбрасываем минорную часть
  }

  // Формируем новый путь
  const newPath = `${parts[0]}_${major.toString().padStart(2, "0")}_${
    minor.toString().padStart(2, "0")
  }`;
  console.log(newPath, "newPath");

  return newPath;
}

export { pathIncrement };
